// deno run -A scripts/fix-edge-functions.ts
import { expandGlob } from "https://deno.land/std@0.210.0/fs/expand_glob.ts";

const EDGE_GLOB = "supabase/functions/**/index.ts";
const SHARED_IMPORTS = [
  `import { withRateLimit, getTenantFromJWT, RateLimits } from "../_shared/rate-limit-wrapper.ts";`,
  `import { createLogger } from "../_shared/logger.ts";`,
  `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";`,
];

const TIERS: Record<string, string> = {
  "outbox-drain": "admin",
  "delete-account": "auth",
  "export-user-data": "auth",
  "health-liveness": "high",
  "health-readiness": "high",
  "rocker-chat": "expensive",
  "rocker-voice-session": "expensive",
  "upload-media": "expensive",
  "generate-embeddings": "expensive",
  "kb-ingest": "expensive",
  "kb-search": "high",
  "entity-lookup": "standard",
  "save-post": "auth",
  "unsave-post": "auth",
  "consent-accept": "auth",
  "consent-revoke": "auth",
  "consent-status": "standard",
  "aggregate-learnings": "admin",
  "analyze-traces": "expensive",
  "apply-deltas": "admin",
  "auto-sync-entities": "standard",
  "calendar-ops": "high",
  "chat-store": "high",
  "create-checkout-session": "auth",
  "crm-track": "standard",
  "generate-event-form": "expensive",
  "generate-preview": "expensive",
  "generate-suggestions": "expensive",
  "google-drive-auth": "auth",
  "google-drive-download": "standard",
  "google-drive-list": "standard",
  "kb-item": "standard",
  "kb-playbook": "standard",
  "kb-related": "standard",
  "moderate-memory": "expensive",
  "process-calendar-reminders": "admin",
  "process-jobs": "admin",
  "recall-content": "standard",
  "reshare-post": "auth",
  "rocker-admin": "admin",
  "rocker-fetch-url": "standard",
  "rocker-health": "high",
  "rocker-memory": "standard",
  "rocker-process-file": "expensive",
  "rocker-proposals": "standard",
  "stripe-webhook": "high",
  "sync-unknowns-to-entities": "admin",
  "term-lookup": "standard",
  "text-to-speech": "expensive",
};

const CORS =
  `const corsHeaders = {\n` +
  `  "Access-Control-Allow-Origin": "*",\n` +
  `  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",\n` +
  `};`;

function ensureImports(src: string): string {
  let updated = src;
  for (const line of SHARED_IMPORTS) {
    if (!updated.includes(line)) {
      // insert after first import or at top
      const firstImport = updated.match(/^import .*;$/m)?.[0];
      updated = firstImport ? updated.replace(firstImport, `${firstImport}\n${line}`) : `${line}\n${updated}`;
    }
  }
  if (!updated.includes("const corsHeaders =")) {
    updated = `${CORS}\n\n${updated}`;
  }
  return updated;
}

function endpointNameFromPath(path: string) {
  const parts = path.split("/");
  const idx = parts.indexOf("functions");
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : "endpoint";
}

function insertLimiterAndLogger(src: string, endpoint: string, tier: string): string {
  // Ensure serve(async (req) => { … }) or Deno.serve(async (req) => { … }) exists
  const serveStart = /(?:^|\s)(?:serve|Deno\.serve)\(\s*async\s*\(\s*req\s*\)\s*=>\s*\{/m;
  if (!serveStart.test(src)) return src;

  // Ensure CORS preflight block then limiter immediately after it
  // If an OPTIONS block exists, inject rate limit after it; else after serve line.
  const limiter =
    `\n  // Rate limit\n` +
    `  const limited = await withRateLimit(req, '${endpoint}', RateLimits.${tier});\n` +
    `  if (limited) return limited;\n\n` +
    `  const log = createLogger('${endpoint}');\n` +
    `  log.startTimer();\n`;

  const hasLimiter = src.includes("withRateLimit(req");
  const hasLogger = src.includes("createLogger(");

  if (hasLimiter && hasLogger) return src; // already done

  const serveLineMatch = src.match(serveStart);
  if (!serveLineMatch) return src;

  const corsRe = /(if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)\s*\{[\s\S]*?\})/m;
  if (corsRe.test(src)) {
    // Place limiter after preflight
    src = src.replace(corsRe, (m) => `${m}\n${hasLimiter ? "" : limiter}`);
  } else {
    // Place limiter right after serve(
    src = src.replace(serveStart, (m) => `${m}\n${hasLimiter ? "" : limiter}`);
  }
  return src;
}

function stripHardcodedTenant(src: string): string {
  // skip the line that defines GLOBAL_TENANT constant
  const lines = src.split("\n");
  const ZERO = /["']00000000-0000-0000-0000-000000000000["']/g;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const GLOBAL_TENANT")) continue;
    // only replace when used as a value (tenant_id / tenantId / p_tenant)
    if (/(tenant_id|tenantId|p_tenant)\s*[:=]\s*["']00000000-0000-0000-0000-000000000000["']/.test(lines[i])) {
      lines[i] = lines[i].replace(
        ZERO,
        "(getTenantFromJWT(req) ?? 'GLOBAL')"
      );
    }
  }
  return lines.join("\n");
}

function replaceConsoleWithStructured(src: string): string {
  // Replace inside handlers; log.info/error will be available after createLogger injection
  return src
    .replace(/console\.error\(/g, "log.error(")
    .replace(/console\.warn\(/g, "log.info(")
    .replace(/console\.log\(/g, "log.info(");
}

let changed = 0;
for await (const f of expandGlob(EDGE_GLOB)) {
  let src = await Deno.readTextFile(f.path);
  const before = src;

  const endpoint = endpointNameFromPath(f.path);
  const tier = TIERS[endpoint] ?? "standard";

  src = ensureImports(src);
  src = stripHardcodedTenant(src);
  src = insertLimiterAndLogger(src, endpoint, tier);
  src = replaceConsoleWithStructured(src);

  if (src !== before) {
    await Deno.writeTextFile(f.path, src);
    console.log(`✅ fixed: ${f.path}  (tier=${tier})`);
    changed++;
  }
}
console.log(changed ? `✨ Updated ${changed} edge functions` : "👌 Nothing to change");

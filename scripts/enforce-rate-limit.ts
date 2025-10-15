// scripts/enforce-rate-limit.ts
// Idempotently ensures every /supabase/functions/*/index.ts imports + uses withRateLimit().
// Elon-style: minimal, fast, safe.

import { expandGlob } from "https://deno.land/std@0.224.0/fs/expand_glob.ts";

const TIERS: Record<string, keyof typeof Tier> = {
  "outbox-drain": "admin",
  "delete-account": "auth",
  "health-liveness": "high",
  "health-readiness": "high",
  "rocker-chat": "expensive",
  "rocker-voice-session": "expensive",
  "upload-media": "expensive",
  "generate-embeddings": "expensive",
  "kb-search": "high",
  "kb-ingest": "expensive",
};
const Tier = { standard: "standard", auth: "auth", admin: "admin", high: "high", expensive: "expensive" } as const;

for await (const f of expandGlob("supabase/functions/*/index.ts")) {
  const path = f.path;
  let src = await Deno.readTextFile(path);

  // 0) Skip if already limited
  if (src.includes("withRateLimit(")) continue;

  // 1) Ensure import exists
  const importLine = `import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";`;
  if (!src.includes("withRateLimit") && !src.includes("rate-limit-wrapper.ts")) {
    // After first import or at top
    const m = src.match(/^import .*;$/m);
    if (m) {
      src = src.replace(m[0], `${m[0]}\n${importLine}`);
    } else {
      src = `${importLine}\n${src}`;
    }
  }

  // 2) Choose bucket + tier from file name
  const fnName = path.split("/")[2]; // functions/<name>/index.ts
  const tier = TIERS[fnName] ?? "standard";

  // 3) Insert limiter right after CORS preflight if present, else right after Deno.serve
  const serveNeedle = /Deno\.serve\(\s*async\s*\(\s*req\s*\)\s*=>\s*\{/;
  const corsBlock = /(if\s*\(\s*req\.method\s*===\s*['"]OPTIONS['"]\s*\)\s*\{[\s\S]*?\})/;

  const limiter = `
  // Apply rate limiting
  const limited = await withRateLimit(req, '${fnName}', RateLimits.${tier});
  if (limited) return limited;
`;

  if (corsBlock.test(src)) {
    // place after the CORS block that appears first within Deno.serve
    src = src.replace(
      new RegExp(`(${serveNeedle.source}[\\s\\S]*?${corsBlock.source})`),
      (m) => `${m}\n${limiter}`
    );
  } else {
    // place right after Deno.serve line
    src = src.replace(serveNeedle, (m) => `${m}\n${limiter}`);
  }

  await Deno.writeTextFile(path, src);
  console.log(`✅ rate-limited: ${fnName}`);
}
console.log("✨ All done.");

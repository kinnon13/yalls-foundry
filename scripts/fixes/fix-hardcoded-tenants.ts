// deno run -A scripts/fix-hardcoded-tenants.ts
import { expandGlob } from "https://deno.land/std@0.224.0/fs/mod.ts";

const ZERO = /['"`]00000000-0000-0000-0000-000000000000['"`]/g;
const EDGE_GLOB = "supabase/functions/*/index.ts";
const SKIP = new Set([
  "src/lib/tenancy/context.ts", // may define a test constant
]);

const injectImport = (src: string) => {
  if (src.includes("getTenantFromJWT")) return src;
  const line = `import { getTenantFromJWT } from "../_shared/rate-limit-wrapper.ts";`;
  const firstImport = src.match(/^import .*;$/m)?.[0];
  return firstImport ? src.replace(firstImport, `${firstImport}\n${line}`) : `${line}\n${src}`;
};

for await (const f of expandGlob(EDGE_GLOB)) {
  if (SKIP.has(f.path)) continue;
  let src = await Deno.readTextFile(f.path);
  if (!ZERO.test(src)) continue;

  src = injectImport(src);
  // Replace the zero tenant with runtime tenant
  src = src.replace(
    ZERO,
    "(getTenantFromJWT(req) ?? user?.id ?? 'GLOBAL')"
  );

  await Deno.writeTextFile(f.path, src);
  console.log(`✅ tenant fixed: ${f.path}`);
}

console.log("✨ Done. Now search for any leftovers:");

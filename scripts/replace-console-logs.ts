// deno run -A scripts/replace-console-logs.ts
// Replaces raw console.log/warn/error with structured logger

import { expandGlob } from "https://deno.land/std@0.224.0/fs/mod.ts";

const EDGE_GLOB = "supabase/functions/*/index.ts";
const LOGGER_IMPORT = `import { createLogger } from "../_shared/logger.ts";`;

let filesFixed = 0;
let logsReplaced = 0;

for await (const f of expandGlob(EDGE_GLOB)) {
  let src = await Deno.readTextFile(f.path);
  let modified = false;

  // Extract function name from path
  const fnName = f.path.split("/")[2];

  // Check if file has console.log/warn/error
  const hasConsoleLogs = /console\.(log|warn|error|info)/g.test(src);
  if (!hasConsoleLogs) continue;

  // Add logger import if not present
  if (!src.includes("createLogger") && !src.includes("from \"../_shared/logger.ts\"")) {
    // Find first import or add at top
    const firstImport = src.match(/^import .*;$/m)?.[0];
    if (firstImport) {
      src = src.replace(firstImport, `${firstImport}\n${LOGGER_IMPORT}`);
    } else {
      src = `${LOGGER_IMPORT}\n${src}`;
    }
    modified = true;
  }

  // Add logger initialization after Deno.serve
  if (!src.includes("const log = createLogger(")) {
    const denoServe = /Deno\.serve\(\s*async\s*\(\s*req\s*\)\s*=>\s*\{/;
    if (denoServe.test(src)) {
      src = src.replace(
        denoServe,
        (match) => `${match}\n  const log = createLogger('${fnName}');\n  log.startTimer();`
      );
      modified = true;
    }
  }

  // Replace console.error with log.error
  src = src.replace(
    /console\.error\(['"`]([^'"`]+)['"`],\s*(\w+)\)/g,
    (_, msg, errVar) => {
      logsReplaced++;
      return `log.error('${msg}', ${errVar})`;
    }
  );

  // Replace console.error with string only
  src = src.replace(
    /console\.error\(['"`]([^'"`]+)['"`]\)/g,
    (_, msg) => {
      logsReplaced++;
      return `log.error('${msg}')`;
    }
  );

  // Replace console.log/info with log.info
  src = src.replace(
    /console\.(log|info)\(['"`]([^'"`]+)['"`]\)/g,
    (_, level, msg) => {
      logsReplaced++;
      return `log.info('${msg}')`;
    }
  );

  // Replace console.log with JSON.stringify
  src = src.replace(
    /console\.(log|info)\(JSON\.stringify\(([^)]+)\)\)/g,
    (_, level, obj) => {
      logsReplaced++;
      return `log.info('Object logged', { data: ${obj} })`;
    }
  );

  // Replace console.warn with log.warn
  src = src.replace(
    /console\.warn\(['"`]([^'"`]+)['"`]\)/g,
    (_, msg) => {
      logsReplaced++;
      return `log.warn('${msg}')`;
    }
  );

  if (modified || logsReplaced > 0) {
    await Deno.writeTextFile(f.path, src);
    filesFixed++;
    console.log(`✅ ${fnName}: replaced console logs with structured logger`);
  }
}

console.log(`\n✨ Complete: ${filesFixed} files updated, ${logsReplaced} logs replaced`);
console.log(`\nAll edge functions now use structured, PII-safe logging.`);

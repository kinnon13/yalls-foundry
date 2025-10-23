#!/usr/bin/env -S deno run -A
// Orphan Asset Scanner - finds unused images/videos in public folder
import { listFiles } from "../modules/utils.ts";
import { header, line } from "../modules/logger.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

header("FIND ORPHAN ASSETS");

const assets = await listFiles("public", [".png", ".jpg", ".jpeg", ".svg", ".mp4", ".webp", ".gif"]);
const srcFiles = await listFiles("src", [".ts", ".tsx", ".js", ".jsx", ".html", ".css"]);

console.log(`Found ${assets.length} assets in public/`);
console.log(`Scanning ${srcFiles.length} source files...`);

const used = new Set<string>();

for (const f of srcFiles) {
  try {
    const txt = await Deno.readTextFile(f);
    for (const a of assets) {
      const assetName = a.split("/").pop()!;
      if (txt.includes(assetName) || txt.includes(a)) {
        used.add(a);
      }
    }
  } catch (e) {
    // Skip files that can't be read
  }
}

const orphans = assets.filter(a => !used.has(a));

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalAssets: assets.length,
    usedAssets: used.size,
    orphanAssets: orphans.length,
  },
  orphans,
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/orphan-assets-results.json`,
  JSON.stringify(report, null, 2)
);

console.log(`\n🗑️  Orphan assets: ${orphans.length}`);
if (orphans.length > 0) {
  console.log(`\nUnused files:`);
  orphans.forEach(o => console.log(`   • ${o}`));
  console.log(`\n💡 Consider removing unused assets to reduce bundle size`);
} else {
  console.log(`✅ All assets are referenced in code`);
}

line();

#!/usr/bin/env node
// Remap & report legacy routes and terms across the repo.
// Safe auto-fixes: /equistats → /equinestats, /entrant → /entries
// Reports (manual/contextual): /organizer, /incentives, bare /crm

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const exts = new Set(['.ts','.tsx','.js','.jsx','.json','.yml','.yaml','.sql','.md']);
const ignoreDirs = new Set(['node_modules','.git','dist','.next','build','coverage']);

const FORBIDDEN = [
  { id: 'organizer', rx: /\/organizer(\b|\/)/g, suggestion: '/workspace/:entityId/events/* (via alias)' },
  { id: 'incentives', rx: /\/incentives(\b|\/)/g, suggestion: '/workspace/:entityId/programs' },
  { id: 'crm-root',   rx: /(?<!:)\b\/crm(\b|\/)/g, suggestion: '/workspace/:entityId/crm' },
];

const AUTOFIX = [
  { id: 'equistats', from: /\/equistats\b/g, to: '/equinestats' },
  { id: 'equistats-slash', from: /\/equistats\//g, to: '/equinestats/' },
  { id: 'entrant', from: /\/entrant\b/g, to: '/entries' },
  { id: 'entrant-slash', from: /\/entrant\//g, to: '/entries/' },
];

const DRY = process.argv.includes('--check');
const WRITE = process.argv.includes('--write');

let hits = [];
let fixed = 0;
let scanned = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (ignoreDirs.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!exts.has(path.extname(name))) continue;
    scanFile(p);
  }
}

function scanFile(p) {
  scanned++;
  let txt = fs.readFileSync(p, 'utf8');

  // Skip canonical config so aliases themselves don’t trigger
  if (p.includes('configs/area-discovery.json')) return;

  // Auto-fix easy ones
  let before = txt;
  for (const m of AUTOFIX) {
    txt = txt.replace(m.from, m.to);
  }
  if (txt !== before && WRITE) {
    fs.writeFileSync(p, txt, 'utf8');
    fixed++;
  }

  // Report forbidden patterns
  const lines = txt.split('\n');
  FORBIDDEN.forEach(rule => {
    lines.forEach((line, i) => {
      if (rule.rx.test(line)) {
        hits.push({ file: p, line: i+1, text: line.trim(), rule: rule.id, suggestion: rule.suggestion });
      }
    });
  });
}

walk(ROOT);

console.log(`\nScanned files: ${scanned}`);
if (WRITE) console.log(`Auto-fixed simple aliases: ${fixed}`);
if (hits.length) {
  console.log(`\n❌ Legacy references still present (${hits.length}):`);
  for (const h of hits.slice(0, 200)) {
    console.log(`- [${h.rule}] ${h.file}:${h.line}\n    ${h.text}\n    → Suggest: ${h.suggestion}`);
  }
  if (hits.length > 200) console.log(`...and ${hits.length-200} more`);
  if (process.argv.includes('--fail-on-hit')) process.exit(1);
} else {
  console.log('\n✅ No legacy references found (organizer/incentives/crm root).');
}
if (DRY && fixed) {
  console.log('\nℹ️ Run again with --write to apply the safe auto-fixes shown above.');
}

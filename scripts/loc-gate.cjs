#!/usr/bin/env node
/* Usage: node scripts/loc-gate.cjs "src/**/*.{ts,tsx}" --limit=150 --exclude="src/components/ui/" */
const fs = require('fs');
const path = require('path');

const DEFAULT_LIMIT = 150;

function arg(name, fallback) {
  const a = process.argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : fallback;
}

const pattern = process.argv.slice(2).find(a => !a.startsWith('--')) || 'src/**/*.{ts,tsx}';
const limit = parseInt(arg('limit', String(DEFAULT_LIMIT)), 10);
const exclude = (arg('exclude', '') || '').replace(/\\/g, '/');

console.log(`\n📏 LOC Gate: "${pattern}"  limit=${limit}`);
if (exclude) console.log(`🚧 Excluding prefix: ${exclude}\n`);

function listFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

function matches(p) {
  const norm = p.replace(/\\/g, '/');
  if (exclude && norm.startsWith(exclude)) return false;
  // minimal matcher: only checks extension set like **/*.{ts,tsx}
  if (!pattern.includes('{')) return norm.endsWith('.ts') || norm.endsWith('.tsx');
  const exts = pattern.match(/\{(.+)\}/)?.[1]?.split(',').map(s => s.trim()) || [];
  return exts.some(ext => norm.endsWith(ext));
}

const files = listFiles('src').filter(matches);
const offenders = [];

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n').length;
  if (lines > limit) offenders.push({ file: f, lines });
}

if (offenders.length) {
  console.error(`\n❌ LOC Gate FAILED (limit=${limit}). Offenders:`);
  offenders.forEach(o => console.error(` - ${o.file} (${o.lines} lines)`));
  process.exit(1);
}
console.log(`✅ LOC Gate OK. Checked ${files.length} files.\n`);

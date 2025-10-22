// Count ONLY routes inside the main <Routes>...</Routes> block in src/App.tsx
import fs from 'node:fs';

const path = 'src/App.tsx';
if (!fs.existsSync(path)) {
  console.error(`❌ Missing ${path}`);
  process.exit(1);
}

// Read raw (keep markers if present)
const raw = fs.readFileSync(path, 'utf8');

// Helper: strip JS/TS/JSX comments
const stripComments = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

// 1) Prefer explicit markers if present
const startIdx = raw.indexOf('ROUTE_BUDGET_START');
const endIdx = raw.indexOf('ROUTE_BUDGET_END');
let target = '';

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
  target = raw.slice(startIdx, endIdx);
} else {
  // 2) Fallback: score all <Routes> blocks in App.tsx and pick the canonical one
  const blocks = raw.match(/<Routes[\s\S]*?<\/Routes>/g) || [];
  if (blocks.length === 0) {
    console.error('❌ No <Routes> block found in src/App.tsx');
    process.exit(1);
  }

  const score = (b) => {
    let s = 0;
    if (/path=["']\*["']/.test(b)) s += 5;
    if (/path=["']\/["']/.test(b)) s += 2;
    if (/path=["']\/dashboard["']/.test(b)) s += 3;
    if (/path=["']\/auth["']/.test(b)) s += 2;
    if (/path=["']\/auth\/callback["']/.test(b)) s += 2;
    if (/path=["']\/privacy["']/.test(b)) s += 1;
    if (/path=["']\/terms["']/.test(b)) s += 1;
    if (/path=["']\/healthz["']/.test(b)) s += 1;
    return s;
  };

  target = (blocks
    .map((b) => ({ b, s: score(b) }))
    .sort((a, b) => b.s - a.s)[0] || { b: blocks[0] }).b;
}

// Strip comments within target then count
const content = stripComments(target);
const count = (content.match(/<Route\s+path=/g) || []).length;

console.log('Route count (main <Routes>):', count);
if (count !== 10) {
  console.error('❌ Route budget violation in main <Routes>. Must be EXACTLY 10.');
  process.exit(1);
}
console.log('✅ Route budget OK');

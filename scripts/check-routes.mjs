// Count ONLY routes inside the main <Routes>...</Routes> block in src/App.tsx
import fs from 'node:fs';

const path = 'src/App.tsx';
if (!fs.existsSync(path)) {
  console.error(`❌ Missing ${path}`);
  process.exit(1);
}

const content = fs
  .readFileSync(path, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')   // strip block comments
  .replace(/\/\/.*$/gm, '');          // strip line comments

// Grab ALL <Routes>...</Routes> blocks
const blocks = content.match(/<Routes[\s\S]*?<\/Routes>/g) || [];
if (blocks.length === 0) {
  console.error('❌ No <Routes> block found in src/App.tsx');
  process.exit(1);
}

// Pick the MAIN routes block:
// 1) block containing path="*" (catch-all) else
// 2) block containing "/" or "/dashboard" else
// 3) first block
let mainBlock =
  blocks.find(b => /path=["']\*["']/.test(b)) ||
  blocks.find(b => /path=["']\/["']/.test(b) || /path=["']\/dashboard["']/.test(b)) ||
  blocks[0];

const count = (mainBlock.match(/<Route\s+path=/g) || []).length;

console.log('Route count (main <Routes>):', count);
if (count !== 10) {
  console.error('❌ Route budget violation in main <Routes>. Must be EXACTLY 10.');
  process.exit(1);
}
console.log('✅ Route budget OK');

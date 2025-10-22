// Enforce EXACTLY 10 <Route path=...> entries in src/App.tsx
import fs from 'node:fs';

const path = 'src/App.tsx';
if (!fs.existsSync(path)) {
  console.error(`❌ Missing ${path}`);
  process.exit(1);
}
const s = fs.readFileSync(path, 'utf8');
const count = (s.match(/<Route\s+path=/g) || []).length;

console.log('Route count:', count);
if (count !== 10) {
  console.error('❌ Route budget violation. Must be EXACTLY 10.');
  process.exit(1);
}
console.log('✅ Route budget OK');

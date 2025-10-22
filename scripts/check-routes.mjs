// Enforce EXACTLY 10 <Route path=...> entries in the MAIN <Routes> block of src/App.tsx
import fs from 'node:fs';

const path = 'src/App.tsx';
if (!fs.existsSync(path)) {
  console.error(`❌ Missing ${path}`);
  process.exit(1);
}
const content = fs.readFileSync(path, 'utf8');

// Only count <Route> inside the first <Routes>...</Routes> block
const match = content.match(/<Routes>([\s\S]*?)<\/Routes>/);
const scope = match ? match[1] : content;

const count = (scope.match(/<Route\s+path=/g) || []).length;
console.log('Route count:', count);

if (count !== 10) {
  console.error('❌ Route budget violation. Must be EXACTLY 10.');
  process.exit(1);
}
console.log('✅ Route budget OK');

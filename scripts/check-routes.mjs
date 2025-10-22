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

// Extract only the AppContent function
const appContentMatch = content.match(/function AppContent\(\)[\s\S]*?^}\s*$/m);
if (!appContentMatch) {
  console.error('❌ Could not find AppContent function in src/App.tsx');
  process.exit(1);
}

const appContentCode = appContentMatch[0];

// Find the <Routes> block within AppContent
const routesMatch = appContentCode.match(/<Routes>([\s\S]*?)<\/Routes>/);
if (!routesMatch) {
  console.error('❌ No <Routes> block found in AppContent function');
  process.exit(1);
}

const routesContent = routesMatch[1];

// Count <Route path= occurrences
const count = (routesContent.match(/<Route\s+path=/g) || []).length;

console.log('Route count (main <Routes>):', count);
if (count !== 10) {
  console.error('❌ Route budget violation in main <Routes>. Must be EXACTLY 10.');
  process.exit(1);
}
console.log('✅ Route budget OK');

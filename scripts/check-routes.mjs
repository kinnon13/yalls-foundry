/**
 * Route Budget Checker
 * Enforces max 10 routes in App.tsx
 * Run via: node scripts/check-routes.mjs
 */

import fs from 'node:fs';

const MAX_ROUTES = 10;
const appFile = 'src/App.tsx';

try {
  const content = fs.readFileSync(appFile, 'utf8');
  
  // Count <Route path= occurrences (naive but effective)
  const matches = content.match(/<Route\s+path=/g) || [];
  const count = matches.length;
  
  console.log(`Route count: ${count}`);
  
  if (count > MAX_ROUTES) {
    console.error(`❌ Route budget exceeded! Found ${count} routes, maximum is ${MAX_ROUTES}.`);
    process.exit(1);
  }
  
  console.log(`✅ Route budget OK (${count}/${MAX_ROUTES})`);
} catch (error) {
  console.error('Error reading App.tsx:', error.message);
  process.exit(1);
}

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
  
  // Extract only the main Routes block (AppContent function)
  // Exclude PreviewRoutes and other nested route components
  const appContentMatch = content.match(/function AppContent\(\)[^]*?<Routes>([\s\S]*?)<\/Routes>/);
  const mainRoutesContent = appContentMatch ? appContentMatch[1] : content;
  
  // Count <Route path= occurrences in main Routes only
  const matches = mainRoutesContent.match(/<Route\s+path=/g) || [];
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

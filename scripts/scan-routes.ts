#!/usr/bin/env tsx
// Quick route scanner - discovers all routes in src/routes/
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface Route {
  path: string;
  file: string;
  features?: string[];
}

const ROUTES_DIR = 'src/routes';
const OUTPUT_FILE = 'generated/route-manifest.json';

// Extract @feature(...) annotations from file content
function extractFeatures(content: string): string[] {
  const matches = content.match(/@feature\(([^)]+)\)/g);
  if (!matches) return [];
  return matches.map(m => m.match(/@feature\(([^)]+)\)/)?.[1].replace(/['"]/g, '') || '').filter(Boolean);
}

// Convert file path to route path
function fileToRoute(filePath: string): string {
  let route = filePath
    .replace(/^src\/routes\//, '/')
    .replace(/\.(tsx?|jsx?)$/, '')
    .replace(/\/index$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1'); // [id] -> :id
  
  if (route === '/') return '/';
  return route || '/';
}

async function scanRoutes() {
  const files = await glob(`${ROUTES_DIR}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*']
  });
  
  const routes: Route[] = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const features = extractFeatures(content);
    const routePath = fileToRoute(file);
    
    routes.push({
      path: routePath,
      file,
      features: features.length > 0 ? features : undefined
    });
  }
  
  // Create output directory
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  
  // Write manifest
  const manifest = {
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    lastUpdated: new Date().toISOString().split('T')[0],
    version: '1.0.0',
    totalRoutes: routes.length,
    withFeatures: routes.filter(r => r.features && r.features.length > 0).length
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n');
  
  console.log(`\n📍 Route Manifest Generated`);
  console.log(`   - Total routes: ${manifest.totalRoutes}`);
  console.log(`   - With @feature tags: ${manifest.withFeatures} (${(manifest.withFeatures / manifest.totalRoutes * 100).toFixed(1)}%)`);
  console.log(`   - Output: ${OUTPUT_FILE}\n`);
}

scanRoutes().catch(console.error);

#!/usr/bin/env tsx
/**
 * Route Manifest Generator
 * Scans src/routes and generates route-manifest.json
 */

import fs from 'fs';
import { glob } from 'glob';

interface RouteEntry {
  path: string;
  file: string;
  components: string[];
  flags: string[];
  features: string[];
}

const FEATURE_REGEX = /@feature\(([\w_]+)\)/g;
const FLAG_REGEX = /useFeatureFlag\(['"](\w+)['"]\)/g;

async function main() {
  console.log('🗺️  Generating route manifest...\n');

  const routes: RouteEntry[] = [];
  const routeFiles = await glob('src/routes/**/*.{ts,tsx}', {
    ignore: ['**/*.test.*', '**/*.spec.*'],
  });

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Extract route path from file structure
    const relativePath = file.replace('src/routes', '');
    let routePath = relativePath
      .replace(/\/index\.tsx?$/, '')
      .replace(/\.tsx?$/, '')
      .replace(/\[(\w+)\]/g, ':$1');

    if (!routePath) routePath = '/';

    // Extract features
    const features = Array.from(content.matchAll(FEATURE_REGEX)).map(m => m[1]);

    // Extract flags
    const flags = Array.from(content.matchAll(FLAG_REGEX)).map(m => m[1]);

    // Extract component imports (simple heuristic)
    const componentMatches = content.match(/from ['"]@\/components\/([\w/]+)['"]/g) || [];
    const components = componentMatches.map(m => {
      const match = m.match(/from ['"]@\/components\/([\w/]+)['"]/);
      return match ? `src/components/${match[1]}` : '';
    }).filter(Boolean);

    routes.push({
      path: routePath,
      file,
      components: [...new Set(components)].sort(),
      flags: [...new Set(flags)].sort(),
      features: [...new Set(features)].sort(),
    });
  }

  // Sort by path
  routes.sort((a, b) => a.path.localeCompare(b.path));

  // Ensure generated directory exists
  if (!fs.existsSync('generated')) {
    fs.mkdirSync('generated');
  }

  // Write manifest
  const manifest = { routes, generatedAt: new Date().toISOString() };
  fs.writeFileSync('generated/route-manifest.json', JSON.stringify(manifest, null, 2) + '\n');

  console.log(`✅ Generated route manifest with ${routes.length} routes`);
  console.log(`   Output: generated/route-manifest.json`);
}

main().catch(console.error);

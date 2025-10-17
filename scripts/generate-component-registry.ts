#!/usr/bin/env tsx
/**
 * Component Registry Generator
 * Scans src/components and generates component-registry.json
 */

import fs from 'fs';
import { glob } from 'glob';

interface ComponentEntry {
  path: string;
  exports: string[];
  features: string[];
}

const FEATURE_REGEX = /@feature\(([\w_]+)\)/g;
const EXPORT_REGEX = /export (?:default )?(function|const|class) (\w+)/g;

async function main() {
  console.log('📦 Generating component registry...\n');

  const components: ComponentEntry[] = [];
  const componentFiles = await glob('src/components/**/*.{ts,tsx}', {
    ignore: ['**/*.test.*', '**/*.spec.*'],
  });

  for (const file of componentFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Extract features
    const features = Array.from(content.matchAll(FEATURE_REGEX)).map(m => m[1]);

    // Extract exports
    const exports = Array.from(content.matchAll(EXPORT_REGEX)).map(m => m[2]);

    components.push({
      path: file,
      exports: [...new Set(exports)].sort(),
      features: [...new Set(features)].sort(),
    });
  }

  // Sort by path
  components.sort((a, b) => a.path.localeCompare(b.path));

  // Ensure generated directory exists
  if (!fs.existsSync('generated')) {
    fs.mkdirSync('generated');
  }

  // Write registry
  const registry = { components, generatedAt: new Date().toISOString() };
  fs.writeFileSync('generated/component-registry.json', JSON.stringify(registry, null, 2) + '\n');

  console.log(`✅ Generated component registry with ${components.length} components`);
  console.log(`   Output: generated/component-registry.json`);

  // Summary by feature
  const byFeature = new Map<string, number>();
  for (const comp of components) {
    for (const feat of comp.features) {
      byFeature.set(feat, (byFeature.get(feat) || 0) + 1);
    }
  }

  if (byFeature.size > 0) {
    console.log('\n📊 Components per feature:');
    for (const [feat, count] of Array.from(byFeature.entries()).sort()) {
      console.log(`   ${feat}: ${count}`);
    }
  }
}

main().catch(console.error);

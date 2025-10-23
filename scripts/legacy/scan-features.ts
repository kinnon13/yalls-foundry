#!/usr/bin/env tsx
/**
 * Feature Scanner
 * Scans codebase for @feature() annotations and updates features.json
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface Feature {
  id: string;
  area: string;
  title: string;
  status: string;
  routes: string[];
  components: string[];
  rpc: string[];
  flags: string[];
  docs: string;
  tests: {
    unit: string[];
    e2e: string[];
  };
  owner: string;
  severity: string;
  notes: string;
}

interface FeaturesData {
  features: Feature[];
}

const FEATURES_JSON = 'docs/features/features.json';
const FEATURE_REGEX = /@feature\(([\w_]+)\)/g;

async function scanFiles(pattern: string): Promise<Map<string, Set<string>>> {
  const featureFiles = new Map<string, Set<string>>();
  const files = await glob(pattern, { ignore: ['node_modules/**', 'dist/**', '.git/**'] });

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.matchAll(FEATURE_REGEX);

    for (const match of matches) {
      const featureId = match[1];
      if (!featureFiles.has(featureId)) {
        featureFiles.set(featureId, new Set());
      }
      featureFiles.get(featureId)!.add(file);
    }
  }

  return featureFiles;
}

async function main() {
  console.log('🔍 Scanning for @feature() annotations...\n');

  // Load existing features.json
  if (!fs.existsSync(FEATURES_JSON)) {
    console.error(`❌ ${FEATURES_JSON} not found. Create it first.`);
    process.exit(1);
  }

  const data: FeaturesData = JSON.parse(fs.readFileSync(FEATURES_JSON, 'utf-8'));
  const featureMap = new Map(data.features.map(f => [f.id, f]));

  // Scan components
  const components = await scanFiles('src/components/**/*.{ts,tsx}');
  console.log(`📦 Found components for ${components.size} features`);

  // Scan routes
  const routes = await scanFiles('src/routes/**/*.{ts,tsx}');
  console.log(`🛣️  Found routes for ${routes.size} features`);

  // Scan tests
  const tests = await scanFiles('tests/**/*.spec.ts');
  console.log(`🧪 Found tests for ${tests.size} features`);

  // Update features
  for (const [featureId, files] of components.entries()) {
    const feature = featureMap.get(featureId);
    if (feature) {
      feature.components = Array.from(files).sort();
    }
  }

  for (const [featureId, files] of routes.entries()) {
    const feature = featureMap.get(featureId);
    if (feature) {
      // Extract route paths from file names (simple heuristic)
      const routePaths = Array.from(files).map(f => {
        const rel = f.replace('src/routes', '');
        return rel.replace(/\/index\.tsx?$/, '').replace(/\.tsx?$/, '').replace(/\[(\w+)\]/g, ':$1');
      });
      feature.routes = [...new Set([...feature.routes, ...routePaths])].sort();
    }
  }

  for (const [featureId, files] of tests.entries()) {
    const feature = featureMap.get(featureId);
    if (feature) {
      const e2eFiles = Array.from(files).filter(f => f.includes('e2e'));
      const unitFiles = Array.from(files).filter(f => !f.includes('e2e'));
      feature.tests.e2e = [...new Set([...feature.tests.e2e, ...e2eFiles])].sort();
      feature.tests.unit = [...new Set([...feature.tests.unit, ...unitFiles])].sort();
    }
  }

  // Write back
  fs.writeFileSync(FEATURES_JSON, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n✅ Updated ${FEATURES_JSON}`);

  // Summary
  const withComponents = data.features.filter(f => f.components.length > 0).length;
  const withTests = data.features.filter(f => f.tests.e2e.length > 0 || f.tests.unit.length > 0).length;
  const byStatus = data.features.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📊 Summary:');
  console.log(`   Features: ${data.features.length}`);
  console.log(`   With components: ${withComponents}`);
  console.log(`   With tests: ${withTests}`);
  console.log(`   By status:`, byStatus);
}

main().catch(console.error);

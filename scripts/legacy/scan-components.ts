#!/usr/bin/env tsx
// Quick component scanner - discovers all components
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface Component {
  path: string;
  features?: string[];
  exports: string[];
}

const COMPONENTS_DIR = 'src/components';
const OUTPUT_FILE = 'generated/component-registry.json';

// Extract @feature(...) annotations from file content
function extractFeatures(content: string): string[] {
  const matches = content.match(/@feature\(([^)]+)\)/g);
  if (!matches) return [];
  return matches.map(m => m.match(/@feature\(([^)]+)\)/)?.[1].replace(/['"]/g, '') || '').filter(Boolean);
}

// Extract export names
function extractExports(content: string): string[] {
  const exports: string[] = [];
  
  // export default
  if (/export\s+default/.test(content)) {
    exports.push('default');
  }
  
  // export function/const/class Name
  const namedExports = content.match(/export\s+(?:function|const|class)\s+(\w+)/g);
  if (namedExports) {
    exports.push(...namedExports.map(e => e.split(/\s+/).pop() || ''));
  }
  
  return exports.filter(Boolean);
}

async function scanComponents() {
  const files = await glob(`${COMPONENTS_DIR}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*']
  });
  
  const components: Component[] = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const features = extractFeatures(content);
    const exports = extractExports(content);
    
    components.push({
      path: file,
      features: features.length > 0 ? features : undefined,
      exports
    });
  }
  
  // Create output directory
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  
  // Write registry
  const registry = {
    components: components.sort((a, b) => a.path.localeCompare(b.path)),
    lastUpdated: new Date().toISOString().split('T')[0],
    version: '1.0.0',
    totalComponents: components.length,
    withFeatures: components.filter(c => c.features && c.features.length > 0).length
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(registry, null, 2) + '\n');
  
  console.log(`\n🧩 Component Registry Generated`);
  console.log(`   - Total components: ${registry.totalComponents}`);
  console.log(`   - With @feature tags: ${registry.withFeatures} (${(registry.withFeatures / registry.totalComponents * 100).toFixed(1)}%)`);
  console.log(`   - Output: ${OUTPUT_FILE}\n`);
}

scanComponents().catch(console.error);

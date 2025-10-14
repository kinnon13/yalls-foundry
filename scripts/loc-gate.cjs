#!/usr/bin/env node
/**
 * LOC Gate — Lines-of-Code Build Gate
 * 
 * Enforces maximum file length for maintainability.
 * Exits with non-zero code if any file exceeds the limit.
 * 
 * Usage: node scripts/loc-gate.cjs "src/**/*.{ts,tsx}" [--limit 150]
 * 
 * Excludes:
 * - src/components/ui/** (shadcn components)
 * - src/integrations/supabase/** (auto-generated)
 * - *.test.ts, *.test.tsx, *.spec.ts (test files can be longer)
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const DEFAULT_LIMIT = 150;
const EXCLUDE_PATTERNS = [
  'src/components/ui/**',
  'src/integrations/supabase/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
];

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

function isExcluded(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    const globPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${globPattern}$`);
    return regex.test(filePath);
  });
}

// Parse args
const args = process.argv.slice(2);
const pattern = args.find(a => !a.startsWith('--')) || 'src/**/*.{ts,tsx}';
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : DEFAULT_LIMIT;

console.log(`\n📏 LOC Gate: Checking files matching "${pattern}"`);
console.log(`📊 Limit: ${limit} lines per file\n`);

const files = globSync(pattern, { ignore: 'node_modules/**' });
const violations = [];

for (const file of files) {
  if (isExcluded(file)) continue;
  
  const lines = countLines(file);
  if (lines > limit) {
    violations.push({ file, lines });
  }
}

if (violations.length > 0) {
  console.error(`\n❌ FILES EXCEEDING ${limit} LINES:`);
  violations.forEach(v => {
    console.error(`   ${v.file}: ${v.lines} lines (${v.lines - limit} over)`);
  });
  console.error(`\n💥 Build FAILED: ${violations.length} file(s) too long`);
  console.error(`\nFix: Break these files into smaller, focused modules\n`);
  process.exit(1);
}

console.log(`✅ All ${files.length - violations.length} files within ${limit} line limit`);
console.log(`✨ LOC gate PASSED\n`);
process.exit(0);

#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.lovable', 'coverage']);
const LINE_THRESHOLD = 100;

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue;
    
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (/\.(ts|tsx|js|jsx|mjs|css)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      
      if (lines > LINE_THRESHOLD) {
        results.push({ path: fullPath, lines });
      }
    }
  }
  
  return results;
}

const largeFiles = walk('src');
largeFiles.push(...walk('scripts'));

largeFiles.sort((a, b) => b.lines - a.lines);

console.log(`\n📊 Files over ${LINE_THRESHOLD} lines: ${largeFiles.length}\n`);

for (const file of largeFiles) {
  console.log(`${file.lines.toString().padStart(4)} lines - ${file.path}`);
}

console.log(`\n✅ Total: ${largeFiles.length} files over ${LINE_THRESHOLD} lines`);

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
largeFiles.push(...walk('docs'));

largeFiles.sort((a, b) => b.lines - a.lines);

// Generate markdown report
const report = `# Files Over ${LINE_THRESHOLD} Lines

Generated: ${new Date().toISOString()}

**Total: ${largeFiles.length} files**

## Files by Line Count

${largeFiles.map(f => `- **${f.lines} lines** - \`${f.path}\``).join('\n')}

## Summary by Directory

- src/: ${largeFiles.filter(f => f.path.startsWith('src/')).length} files
- scripts/: ${largeFiles.filter(f => f.path.startsWith('scripts/')).length} files
- docs/: ${largeFiles.filter(f => f.path.startsWith('docs/')).length} files
`;

// Write to file
fs.mkdirSync('docs/audit', { recursive: true });
fs.writeFileSync('docs/audit/LARGE_FILES_REPORT.md', report);

console.log(`✅ Report generated: docs/audit/LARGE_FILES_REPORT.md`);
console.log(`📊 Total: ${largeFiles.length} files over ${LINE_THRESHOLD} lines`);

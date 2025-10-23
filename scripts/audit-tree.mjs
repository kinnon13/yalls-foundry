/**
 * Generate complete project tree for audit
 */
import fs from 'node:fs';
import path from 'node:path';

const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.lovable',
  'coverage',
  'playwright-report',
  'test-results',
  '.DS_Store',
  'bun.lockb',
  'package-lock.json',
]);

function walk(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const lines = [];
  entries.forEach((entry, idx) => {
    if (IGNORE.has(entry.name)) return;

    const isLast = idx === entries.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      lines.push(`${prefix}${branch}${entry.name}/`);
      const subPrefix = prefix + (isLast ? '    ' : '│   ');
      lines.push(...walk(fullPath, subPrefix));
    } else {
      const stats = fs.statSync(fullPath);
      const size = stats.size;
      const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}kb` : `${size}b`;
      lines.push(`${prefix}${branch}${entry.name} (${sizeStr})`);
    }
  });

  return lines;
}

console.log('📁 PROJECT TREE AUDIT\n');
console.log('root/');
const tree = walk('.');
console.log(tree.join('\n'));
console.log(`\n✅ Total files scanned: ${tree.filter(l => !l.includes('/')).length}`);

// Write to file
const output = `# Project Tree Audit\nGenerated: ${new Date().toISOString()}\n\n\`\`\`\nroot/\n${tree.join('\n')}\n\`\`\`\n`;
fs.writeFileSync('docs/audit/TREE_SNAPSHOT.md', output);
console.log('📄 Written to docs/audit/TREE_SNAPSHOT.md');

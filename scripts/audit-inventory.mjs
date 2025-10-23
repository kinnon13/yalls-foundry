/**
 * Generate inventory of all overlay apps, routes, and features
 */
import fs from 'node:fs';
import path from 'node:path';

function scanDirectory(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

const report = {
  timestamp: new Date().toISOString(),
  apps: [],
  pages: [],
  routes: [],
  docs: [],
};

// Scan apps
console.log('🔍 Scanning src/apps...');
const appDirs = fs.existsSync('src/apps') 
  ? fs.readdirSync('src/apps', { withFileTypes: true }).filter(d => d.isDirectory())
  : [];

for (const dir of appDirs) {
  const appPath = `src/apps/${dir.name}`;
  const contractPath = `${appPath}/contract.ts`;
  const entryPath = `${appPath}/Entry.tsx`;
  const panelPath = `${appPath}/Panel.tsx`;

  let contract = null;
  if (fs.existsSync(contractPath)) {
    const content = fs.readFileSync(contractPath, 'utf8');
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
    const roleMatch = content.match(/role:\s*['"]([^'"]+)['"]/);
    const routesMatch = content.match(/routes:\s*\[([^\]]+)\]/);
    
    contract = {
      id: idMatch?.[1] || dir.name,
      title: titleMatch?.[1] || dir.name,
      role: roleMatch?.[1] || 'unknown',
      routes: routesMatch ? routesMatch[1].split(',').map(r => r.trim().replace(/['"]/g, '')) : [],
    };
  }

  report.apps.push({
    name: dir.name,
    path: appPath,
    hasContract: fs.existsSync(contractPath),
    hasEntry: fs.existsSync(entryPath),
    hasPanel: fs.existsSync(panelPath),
    contract,
  });
}

// Scan pages
console.log('🔍 Scanning src/pages...');
const pageFiles = scanDirectory('src/pages', /\.(tsx|ts)$/);
for (const file of pageFiles) {
  report.pages.push({
    path: file,
    name: path.basename(file, path.extname(file)),
  });
}

// Scan App.tsx for routes
console.log('🔍 Scanning src/App.tsx...');
if (fs.existsSync('src/App.tsx')) {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  const routeMatches = appContent.matchAll(/<Route\s+path=["']([^"']+)["']/g);
  for (const match of routeMatches) {
    report.routes.push(match[1]);
  }
}

// Scan docs
console.log('🔍 Scanning docs...');
const docFiles = scanDirectory('docs', /\.md$/);
for (const file of docFiles) {
  report.docs.push(file);
}

// Generate markdown report
const md = [];
md.push('# Project Inventory Audit');
md.push(`Generated: ${report.timestamp}\n`);

md.push('## Overlay Apps');
md.push(`Total: ${report.apps.length}\n`);
for (const app of report.apps) {
  md.push(`### ${app.name}`);
  md.push(`- Path: \`${app.path}\``);
  md.push(`- Contract: ${app.hasContract ? '✅' : '❌'}`);
  md.push(`- Entry: ${app.hasEntry ? '✅' : '❌'}`);
  md.push(`- Panel: ${app.hasPanel ? '✅' : '❌'}`);
  if (app.contract) {
    md.push(`- ID: \`${app.contract.id}\``);
    md.push(`- Title: "${app.contract.title}"`);
    md.push(`- Role: \`${app.contract.role}\``);
    md.push(`- Routes: ${app.contract.routes.map(r => `\`${r}\``).join(', ')}`);
  }
  md.push('');
}

md.push('## Pages');
md.push(`Total: ${report.pages.length}\n`);
for (const page of report.pages) {
  md.push(`- \`${page.path}\``);
}

md.push('\n## Routes in App.tsx');
md.push(`Total: ${report.routes.length}\n`);
for (const route of report.routes) {
  md.push(`- \`${route}\``);
}

md.push('\n## Documentation');
md.push(`Total: ${report.docs.length}\n`);
for (const doc of report.docs) {
  md.push(`- \`${doc}\``);
}

const output = md.join('\n');
fs.writeFileSync('docs/audit/INVENTORY.md', output);

console.log('\n✅ Audit complete!');
console.log(`📊 Apps: ${report.apps.length}`);
console.log(`📄 Pages: ${report.pages.length}`);
console.log(`🛣️  Routes: ${report.routes.length}`);
console.log(`📚 Docs: ${report.docs.length}`);
console.log('\n📄 Written to docs/audit/INVENTORY.md');

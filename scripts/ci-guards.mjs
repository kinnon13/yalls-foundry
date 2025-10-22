// Static guards so no one "goes rogue"
import fs from 'node:fs';

function mustContain(file, patterns) {
  const s = fs.readFileSync(file, 'utf8');
  for (const p of patterns) {
    if (!p.test(s)) {
      console.error(`❌ Guard failed in ${file}: missing ${p}`);
      process.exit(1);
    }
  }
}

function mustNotContain(file, patterns) {
  const s = fs.readFileSync(file, 'utf8');
  for (const p of patterns) {
    if (p.test(s)) {
      console.error(`❌ Guard failed in ${file}: found forbidden ${p}`);
      process.exit(1);
    }
  }
}

const app = 'src/App.tsx';
const dash = 'src/routes/dashboard/index.tsx';
const reg = 'src/lib/overlay/registry.ts';

// 1) Overlay system must NOT be global in App.tsx
mustNotContain(app, [
  /<OverlayHost\s*\/>/,
  /from\s+['"]@\/lib\/overlay\/OverlayHost['"]/,
  /<PanelHost\s*\/>/,
  /from\s+['"]@\/lib\/panel\/PanelHost['"]/,
]);

// 2) Overlay system MUST exist inside Dashboard
mustContain(dash, [
  /from\s+['"]@\/lib\/overlay\/OverlayHost['"]/,
  /<OverlayHost\s*\/>/,
]);

// 3) Ensure catch-all LegacyRedirector route still exists
mustContain(app, [
  /<Route\s+path=["']\*["']\s+element={<LegacyRedirector\s*\/>}\s*\/>/
]);

// 4) Ensure /dashboard route exists
mustContain(app, [
  /<Route\s+path=["']\/dashboard["']\s+element={<Dashboard\s*\/>}\s*\/>/
]);

// 5) Overview must be user accessible in overlay registry
mustContain(reg, [
  /overview["']?\s*:\s*{[^}]*role:\s*["']user["'][^}]*}/s
]);

console.log('✅ CI guards passed');

/**
 * CI Guards - Hard architectural constraints
 * Prevents rogue changes to overlay scoping, route budget, and role configs
 */

import fs from 'node:fs';

function mustContain(file, patterns) {
  const s = fs.readFileSync(file, 'utf8');
  for (const p of patterns) {
    if (!p.test(s)) {
      console.error(`❌ Guard failed: "${file}" does not match ${p}`);
      process.exit(1);
    }
  }
}

function mustNotContain(file, patterns) {
  const s = fs.readFileSync(file, 'utf8');
  for (const p of patterns) {
    if (p.test(s)) {
      console.error(`❌ Guard failed: "${file}" contains forbidden pattern ${p}`);
      process.exit(1);
    }
  }
}

// 1) Overlay must NOT be global in App.tsx (scoped to /dashboard only)
mustNotContain('src/App.tsx', [
  /<OverlayHost/i,
  /<PanelHost/i
]);

// 2) LegacyRedirector route must exist
mustContain('src/App.tsx', [
  /<Route\s+path="\*"\s+element={<LegacyRedirector\s*\/>}\s*\/>/
]);

// 3) Overview role must be 'user'
const reg = 'src/lib/overlay/registry.ts';
mustContain(reg, [
  /overview['"]?\s*:\s*{[^}]*role:\s*['"]user['"]/s
]);

// 4) Overlay registry must be defined (sanity)
mustContain(reg, [
  /export const OVERLAY_REGISTRY\s*:\s*Record/
]);

console.log('✅ CI guards passed');

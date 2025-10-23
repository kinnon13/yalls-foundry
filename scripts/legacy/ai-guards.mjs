// Minimal AI guardrails: ensure core AI/broker wiring exists
import fs from 'node:fs';

function mustContain(file, patterns) {
  const s = fs.readFileSync(file, 'utf8');
  for (const p of patterns) {
    if (!p.test(s)) {
      console.error(`❌ AI guard failed in ${file}: missing ${p}`);
      process.exit(1);
    }
  }
}

function mustExist(file) {
  if (!fs.existsSync(file)) {
    console.error(`❌ AI guard failed: missing file ${file}`);
    process.exit(1);
  }
}

// 1) App capability broker present
mustExist('src/lib/ai/actions.ts');
mustContain('src/lib/ai/actions.ts', [
  /export async function invokeAction/,
]);

// 2) Super Andy app registered in overlay registry
mustExist('src/lib/overlay/registry.ts');
mustContain('src/lib/overlay/registry.ts', [
  /andy["']?\s*:\s*{[^}]*title:\s*['"]Super Andy['"]/s,
]);

// 3) Rocker app registered
mustContain('src/lib/overlay/registry.ts', [
  /rocker["']?\s*:\s*{[^}]*title:\s*['"]Rocker['"]/s,
]);

// 4) Admin Rocker present and role-gated admin
mustContain('src/lib/overlay/registry.ts', [
  /['"]admin-rocker['"]\s*:\s*{[^}]*role:\s*['"]admin['"]/s,
]);

console.log('✅ AI guards passed');

// Simple guard: ensure work-report.json exists, has required fields,
// and that at least one changed file in the PR is documented.

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const requiredTop = ["summary","changes","commands","next","blockers"];
const requiredChange = ["file","description"];

function fail(msg) {
  console.error("❌ Show-Your-Work:", msg);
  process.exit(1);
}

if (!existsSync('work-report.json')) {
  fail('Missing work-report.json in repo root.');
}

let report;
try {
  report = JSON.parse(readFileSync('work-report.json','utf8'));
} catch (e) {
  fail('work-report.json is not valid JSON.');
}

for (const k of requiredTop) {
  if (!(k in report)) fail(`Missing required field "${k}" in work-report.json.`);
}

if (!Array.isArray(report.changes) || report.changes.length === 0) {
  fail('work-report.json.changes must be a non-empty array.');
}

for (const ch of report.changes) {
  for (const rk of requiredChange) {
    if (!(rk in ch)) fail(`Each change must include "${rk}".`);
  }
}

// Get PR body (provided by GitHub in event file)
const evt = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const body = evt.pull_request?.body || '';
const requiredSections = ["Work Report", "Summary", "Changes"];

for (const section of requiredSections) {
  if (!body.toLowerCase().includes(section.toLowerCase())) {
    fail(`PR body missing section text "${section}".`);
  }
}

// Compare reported files vs actual git diff
let changed = [];
try {
  // Compare against merge-base with target branch
  const base = execSync(`git merge-base HEAD origin/${evt.pull_request.base.ref}`, {stdio:['ignore','pipe','pipe']}).toString().trim();
  changed = execSync(`git diff --name-only ${base}...HEAD`, {stdio:['ignore','pipe','pipe']})
    .toString()
    .split('\n')
    .filter(Boolean);
} catch (e) {
  // Non-fatal: continue with empty changed list
}

if (changed.length > 0) {
  const documented = new Set(report.changes.map(c => c.file));
  const undocumented = changed.filter(f => !documented.has(f));
  // Allow e.g., lockfiles and screenshots to be omitted
  const ignored = [/^pnpm-lock\.yaml$/, /^package-lock\.json$/, /^docs\/screenshots\//];
  const reallyUndocumented = undocumented.filter(f => !ignored.some(r => r.test(f)));
  
  if (reallyUndocumented.length > 0) {
    fail(`Files changed but not documented in work-report.json:\n- ${reallyUndocumented.join('\n- ')}`);
  }
}

console.log("✅ Show-Your-Work: report present, PR body ok, files documented.");

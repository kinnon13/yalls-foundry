#!/usr/bin/env node
import fs from 'node:fs';

function fail(msg) {
  console.error('❌ Architecture:', msg);
  process.exit(1);
}

function warn(msg) {
  console.warn('⚠️ Architecture:', msg);
}

function ok(msg) {
  console.log('✅', msg);
}

// Convert glob pattern to regex
function globToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + escaped + '$');
}

// Check if name matches any glob pattern
function matchesAnyGlob(name, patterns) {
  return patterns.some(p => globToRegex(p).test(name));
}

// Check area-discovery.json exists
const cfgPath = 'configs/area-discovery.json';
if (!fs.existsSync(cfgPath)) {
  fail('Missing configs/area-discovery.json');
}

// Parse and validate JSON
let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
} catch (e) {
  fail(`area-discovery.json is not valid JSON: ${e.message}`);
}

// Validate required top-level keys
const requiredKeys = ['areas', 'routeAliases', 'collapsedHeads'];
for (const key of requiredKeys) {
  if (!(key in cfg)) {
    fail(`area-discovery.json missing required key "${key}"`);
  }
}

// Check for either categories or routeCategories
if (!('categories' in cfg) && !('routeCategories' in cfg)) {
  fail('area-discovery.json missing "categories" or "routeCategories"');
}

// Validate route aliases
const aliases = cfg.routeAliases || {};
const requiredAliases = [
  ['/organizer/*', '/workspace/:entityId/events/*'],
  ['/incentives/dashboard', '/workspace/:entityId/programs'],
  ['/dashboard', '/workspace'],
  ['/entrant', '/entries'],
  ['/equistats/*', '/equinestats/*'],
  ['/crm', '/workspace/:entityId/crm']
];

for (const [from, to] of requiredAliases) {
  if (aliases[from] !== to) {
    fail(`alias "${from}" → "${to}" missing or incorrect (got: ${aliases[from] || 'undefined'})`);
  }
}

ok(`All required route aliases present (${requiredAliases.length})`);

// Validate collapsed heads
const heads = new Set(cfg.collapsedHeads || []);
const requiredHeads = ['/equinestats', '/workspace', '/events', '/marketplace'];

for (const head of requiredHeads) {
  if (!heads.has(head)) {
    warn(`collapsedHeads missing recommended entry: "${head}"`);
  }
}

if (heads.has('/equinestats')) {
  ok('collapsedHeads includes "/equinestats"');
} else {
  fail('collapsedHeads must include "/equinestats"');
}

// Validate areas structure
if (!Array.isArray(cfg.areas) || cfg.areas.length === 0) {
  fail('areas must be a non-empty array');
}

for (const area of cfg.areas) {
  if (!area.canonical) {
    fail(`area missing "canonical" field: ${JSON.stringify(area)}`);
  }
  if (!Array.isArray(area.subareas)) {
    fail(`area "${area.canonical}" missing "subareas" array`);
  }
}

ok(`Validated ${cfg.areas.length} areas with canonical names and subareas`);

// Check for critical areas
const canonicalNames = new Set(cfg.areas.map(a => a.canonical));
const criticalAreas = ['dashboard', 'equinestats', 'platform'];

for (const critical of criticalAreas) {
  if (!canonicalNames.has(critical)) {
    warn(`Missing recommended critical area: "${critical}"`);
  }
}

// Load coverage-ignore config
let ignoreConfig = { schemas: [], table_globs: [], rpc_globs: [], catchAll: {} };
const ignorePath = 'configs/coverage-ignore.json';
if (fs.existsSync(ignorePath)) {
  try {
    ignoreConfig = JSON.parse(fs.readFileSync(ignorePath, 'utf8'));
    ok(`Loaded coverage-ignore with ${ignoreConfig.schemas.length} schemas, ${ignoreConfig.table_globs.length} table patterns, ${ignoreConfig.rpc_globs.length} RPC patterns`);
  } catch (e) {
    warn(`coverage-ignore.json invalid: ${e.message}`);
  }
} else {
  warn('coverage-ignore.json not found - run `node scripts/ops-report.mjs` to analyze database coverage');
}

ok('area-discovery.json structure is valid');
console.log('');
console.log('✅ Architecture validation passed');

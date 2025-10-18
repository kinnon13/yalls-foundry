import fs from 'node:fs';
import path from 'node:path';

function fail(msg){ return { ok:false, severity:'critical', msg }; }
function warn(msg){ return { ok:false, severity:'warning', msg }; }
function ok(msg){ return { ok:true, severity:'info', msg }; }

const mustFiles = [
  'configs/area-discovery.json',
  'src/components/theme/ThemeBroker.tsx',
  'theme/tokens.css',
  'src/components/dashboard/KpiTiles.tsx',
  'src/lib/navigation/redirects.ts',
];

const aliasMust = [
  ['/organizer/*','/workspace/:entityId/events/*'],
  ['/incentives/dashboard','/workspace/:entityId/programs'],
  ['/dashboard','/workspace'],
  ['/entrant','/entries'],
  ['/equistats/*','/equinestats/*'],
  ['/crm','/workspace/:entityId/crm'],
];

function readJSON(p){
  return JSON.parse(fs.readFileSync(p,'utf8'));
}

function searchString(root, needle){
  const hits = [];
  function walk(dir){
    for (const f of fs.readdirSync(dir)){
      if (f === 'node_modules' || f.startsWith('.git')) continue;
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else {
        if (/\.(ts|tsx|js|jsx|json|md|yml|css)$/.test(f)) {
          const t = fs.readFileSync(full,'utf8');
          if (t.includes(needle)) hits.push(full);
        }
      }
    }
  }
  walk(root);
  return hits;
}

export function checkRepo(){
  const results = [];

  // required files
  for (const f of mustFiles){
    if (!fs.existsSync(f)) results.push(fail(`Missing file: ${f}`));
    else results.push(ok(`Present: ${f}`));
  }

  // area-discovery.json validity
  if (fs.existsSync('configs/area-discovery.json')){
    try {
      const cfg = readJSON('configs/area-discovery.json');
      for (const k of ['areas','routeAliases','collapsedHeads']){
        if (!(k in cfg)) results.push(fail(`area-discovery.json missing "${k}"`));
      }
      const aliases = cfg.routeAliases || {};
      for (const [from,to] of aliasMust){
        if (aliases[from] !== to) results.push(fail(`alias "${from}" → "${to}" missing/incorrect in area-discovery.json`));
      }
      const heads = new Set(cfg.collapsedHeads || []);
      if (!heads.has('/equinestats')) results.push(fail('collapsedHeads must include "/equinestats"'));

      // sanity: categories or routeCategories
      if (!('categories' in cfg) && !('routeCategories' in cfg)){
        results.push(fail('area-discovery.json missing "categories" or "routeCategories"'));
      } else {
        results.push(ok('area-discovery.json structure looks good'));
      }
    } catch (e) {
      results.push(fail(`area-discovery.json invalid JSON: ${e.message}`));
    }
  }

  // detect stray legacy strings in code outside aliases file
  const strayEquistats = searchString('.', '/equistats').filter(p => !p.endsWith('area-discovery.json'));
  if (strayEquistats.length){
    results.push(warn(`Found legacy "/equistats" references in code: ${strayEquistats.slice(0,5).join(', ')} ...`));
  } else {
    results.push(ok('No stray legacy "/equistats" references found'));
  }

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`){
  console.log(JSON.stringify(checkRepo(), null, 2));
}

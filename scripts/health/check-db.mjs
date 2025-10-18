import pg from 'pg';

function crit(msg){ return { ok:false, severity:'critical', msg }; }
function warn(msg){ return { ok:false, severity:'warning', msg }; }
function ok(msg){ return { ok:true, severity:'info', msg }; }

const REQUIRED_TABLES = [
  'user_segments','entity_segments','ui_theme_overrides'
];

const REQUIRED_RPCS = [
  // name, argcount, securityDefiner, area label (for hints)
  ['recommend_workspace_modules',1,true,'dashboard'],
  ['accept_module_recommendation',2,true,'dashboard'],
  ['set_theme_overrides',3,true,'dashboard'],
  ['get_theme',2,true,'dashboard'],
  ['get_workspace_kpis',2,true,'dashboard'], // p_entity_id, p_horizon defaulted → shows as 2 in many DBs
];

const MUST_HAVE_FUNCS = [
  ['rocker_check_consent',2,true,'ai']
];

const PII_TABLES_SHOULD_HAVE_RLS = [
  'profiles','payments','orders','stalls_rv_reservations','crm_contacts','messages'
];

export async function checkDb(){
  const results = [];
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // 1) tables
  const { rows: tables } = await client.query(`
    select schemaname, tablename, rowsecurity
    from pg_tables t
    join pg_class c on c.relname = t.tablename
    join pg_namespace n on n.nspname = t.schemaname
    where schemaname = 'public'
  `);

  const tableSet = new Set(tables.map(r=>r.tablename));
  for (const t of REQUIRED_TABLES){
    if (!tableSet.has(t)) results.push(crit(`Missing table: ${t}`));
    else results.push(ok(`Present table: ${t}`));
  }

  // RLS for PII-sensitive tables
  for (const t of PII_TABLES_SHOULD_HAVE_RLS){
    const r = tables.find(r=>r.tablename===t);
    if (!r) { results.push(warn(`PII table expected but missing: ${t}`)); continue; }
    if (!r.rowsecurity) results.push(crit(`RLS disabled on PII table: ${t}`));
    else results.push(ok(`RLS enabled: ${t}`));
  }

  // 2) functions / RPCs
  const { rows: funcs } = await client.query(`
    select p.proname as name,
           p.pronargs as argcount,
           p.prosecdef as security_definer,
           n.nspname as schema
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  `);

  function checkFunc(name, expectedArgs, expectedSD, label){
    const f = funcs.find(x=>x.name === name);
    if (!f) return results.push(crit(`Missing RPC/function: ${name}`));
    // argcount can vary with defaults; only flag if wildly off
    if (expectedArgs !== null && (f.argcount < (expectedArgs-1) || f.argcount > (expectedArgs+1))){
      results.push(warn(`Arg count drift for ${name} (got ${f.argcount}, want ~${expectedArgs})`));
    }
    if (!!f.security_definer !== expectedSD){
      results.push(crit(`SECURITY DEFINER mismatch for ${name} (expected ${expectedSD})`));
    } else {
      results.push(ok(`RPC ok: ${name}`));
    }
  }

  for (const [name, args, sd, lbl] of REQUIRED_RPCS){
    checkFunc(name, args, sd, lbl);
  }
  for (const [name, args, sd, lbl] of MUST_HAVE_FUNCS){
    checkFunc(name, args, sd, lbl);
  }

  // 3) smoke calls (structure only)
  try {
    const { rows } = await client.query(`select to_jsonb((select d from (select 1 as ok) d)) as j`);
    if (!rows?.[0]?.j) results.push(warn('DB JSON transform smoke failed'));
    else results.push(ok('DB JSON transform smoke ok'));
  } catch(e){
    results.push(warn(`DB JSON smoke error: ${e.message}`));
  }

  await client.end();
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`){
  checkDb().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{ console.error(e); process.exit(1); });
}

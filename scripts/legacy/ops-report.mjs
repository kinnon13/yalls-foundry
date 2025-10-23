#!/usr/bin/env node
/**
 * Operations Report - Database Coverage Analysis
 * 
 * Generates a report showing:
 * - All tables and RPCs in the database
 * - Which are documented vs undocumented
 * - Filters out noise (partitions, system objects, etc.)
 */

import pg from 'pg';
import fs from 'node:fs';

function globToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + escaped + '$');
}

function matchesAnyGlob(name, patterns) {
  return patterns.some(p => globToRegex(p).test(name));
}

async function generateOpsReport() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Load configs
  const areaDiscovery = JSON.parse(fs.readFileSync('configs/area-discovery.json', 'utf8'));
  const ignoreConfig = JSON.parse(fs.readFileSync('configs/coverage-ignore.json', 'utf8'));

  // Get all tables
  const { rows: allTables } = await client.query(`
    SELECT 
      n.nspname AS schema,
      c.relname AS name,
      c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'  -- base tables only
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY n.nspname, c.relname
  `);

  // Get all functions/RPCs
  const { rows: allFunctions } = await client.query(`
    SELECT 
      n.nspname AS schema,
      p.proname AS name
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND p.prokind = 'f'
    ORDER BY n.nspname, p.proname
  `);

  await client.end();

  // Extract documented patterns from area-discovery
  const documentedTables = new Set();
  const documentedRpcs = new Set();
  
  // Collect all table/RPC references from areas
  for (const area of Object.values(areaDiscovery.areas || {})) {
    if (area.tables) {
      area.tables.forEach(t => documentedTables.add(t));
    }
    if (area.rpcs) {
      area.rpcs.forEach(r => documentedRpcs.add(r));
    }
  }

  // Filter and categorize tables
  const tables = {
    documented: [],
    undocumented: [],
    ignored: [],
    catchAll: []
  };

  for (const table of allTables) {
    // Skip ignored schemas
    if (ignoreConfig.schemas.includes(table.schema)) {
      tables.ignored.push(table.name);
      continue;
    }

    // Skip if matches ignore globs
    if (matchesAnyGlob(table.name, ignoreConfig.table_globs)) {
      tables.ignored.push(table.name);
      continue;
    }

    // Check if documented (exact or glob match)
    const isDocumented = Array.from(documentedTables).some(pattern => {
      if (pattern.includes('*')) {
        return globToRegex(pattern).test(table.name);
      }
      return pattern === table.name;
    });

    if (isDocumented) {
      tables.documented.push(table.name);
    } else if (ignoreConfig.catchAll?.tables) {
      tables.catchAll.push(table.name);
    } else {
      tables.undocumented.push(table.name);
    }
  }

  // Filter and categorize RPCs
  const rpcs = {
    documented: [],
    undocumented: [],
    ignored: [],
    catchAll: []
  };

  for (const func of allFunctions) {
    // Skip ignored schemas
    if (ignoreConfig.schemas.includes(func.schema)) {
      rpcs.ignored.push(func.name);
      continue;
    }

    // Skip if matches ignore globs
    if (matchesAnyGlob(func.name, ignoreConfig.rpc_globs)) {
      rpcs.ignored.push(func.name);
      continue;
    }

    // Check if documented
    const isDocumented = Array.from(documentedRpcs).some(pattern => {
      if (pattern.includes('*')) {
        return globToRegex(pattern).test(func.name);
      }
      return pattern === func.name;
    });

    if (isDocumented) {
      rpcs.documented.push(func.name);
    } else if (ignoreConfig.catchAll?.rpcs) {
      rpcs.catchAll.push(func.name);
    } else {
      rpcs.undocumented.push(func.name);
    }
  }

  // Generate report
  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      tables: {
        total: allTables.length,
        documented: tables.documented.length,
        undocumented: tables.undocumented.length,
        catchAll: tables.catchAll.length,
        ignored: tables.ignored.length
      },
      rpcs: {
        total: allFunctions.length,
        documented: rpcs.documented.length,
        undocumented: rpcs.undocumented.length,
        catchAll: rpcs.catchAll.length,
        ignored: rpcs.ignored.length
      }
    },
    tables,
    rpcs
  };

  // Write report
  fs.writeFileSync('ops-report.json', JSON.stringify(report, null, 2));

  // Print summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Operations Coverage Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Tables:');
  console.log(`  ✅ Documented:   ${tables.documented.length}`);
  console.log(`  🟡 Catch-all:    ${tables.catchAll.length}`);
  console.log(`  ❌ Undocumented: ${tables.undocumented.length}`);
  console.log(`  🔇 Ignored:      ${tables.ignored.length}`);
  console.log('');
  console.log('RPCs:');
  console.log(`  ✅ Documented:   ${rpcs.documented.length}`);
  console.log(`  🟡 Catch-all:    ${rpcs.catchAll.length}`);
  console.log(`  ❌ Undocumented: ${rpcs.undocumented.length}`);
  console.log(`  🔇 Ignored:      ${rpcs.ignored.length}`);
  console.log('');

  if (tables.undocumented.length > 0) {
    console.log('❌ Undocumented tables:');
    tables.undocumented.slice(0, 10).forEach(t => console.log(`  - ${t}`));
    if (tables.undocumented.length > 10) {
      console.log(`  ... and ${tables.undocumented.length - 10} more`);
    }
    console.log('');
  }

  if (rpcs.undocumented.length > 0) {
    console.log('❌ Undocumented RPCs:');
    rpcs.undocumented.slice(0, 10).forEach(r => console.log(`  - ${r}`));
    if (rpcs.undocumented.length > 10) {
      console.log(`  ... and ${rpcs.undocumented.length - 10} more`);
    }
    console.log('');
  }

  if (tables.catchAll.length > 0) {
    console.log('🟡 Tables in catch-all bucket:');
    tables.catchAll.slice(0, 10).forEach(t => console.log(`  - ${t}`));
    if (tables.catchAll.length > 10) {
      console.log(`  ... and ${tables.catchAll.length - 10} more`);
    }
    console.log('');
  }

  console.log(`Report saved to ops-report.json`);
  console.log('');

  // Exit with error if undocumented items found
  if (tables.undocumented.length > 0 || rpcs.undocumented.length > 0) {
    console.error(`❌ Found ${tables.undocumented.length + rpcs.undocumented.length} undocumented items`);
    process.exit(1);
  }

  console.log('✅ All database objects are documented or explicitly ignored');
}

generateOpsReport().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

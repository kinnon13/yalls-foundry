#!/usr/bin/env tsx
/**
 * Rocker Doctor - Automated AI Wiring Audit
 * Validates all AI components are properly connected
 */

import { createClient } from '@supabase/supabase-js';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

interface ComponentConfig {
  description: string;
  prompts: string[];
  tools: string[];
  functions: string[];
  tables: string[];
  triggers: string[];
}

interface CapabilityMatrix {
  components: Record<string, ComponentConfig>;
  infrastructure: Record<string, boolean>;
}

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(status: 'OK' | 'FAIL' | 'WARN' | 'INFO', message: string) {
  const color = status === 'OK' ? COLORS.green : 
                status === 'FAIL' ? COLORS.red :
                status === 'WARN' ? COLORS.yellow : COLORS.blue;
  console.log(`${color}[${status}]${COLORS.reset} ${message}`);
}

async function checkEndpoint(baseUrl: string, path: string): Promise<boolean> {
  try {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, { 
      method: 'OPTIONS',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || ''
      }
    });
    return response.ok || response.status === 405; // OPTIONS or Method Not Allowed is fine
  } catch (error) {
    return false;
  }
}

async function checkTable(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(0);
    return !error || error.code === 'PGRST116'; // Empty result is fine
  } catch {
    return false;
  }
}

async function main() {
  console.log('\n🔍 Rocker Doctor - AI Wiring Audit\n');

  // Load capability matrix
  const matrixPath = path.join(process.cwd(), 'rocker_capability_matrix.yml');
  if (!fs.existsSync(matrixPath)) {
    log('FAIL', 'rocker_capability_matrix.yml not found');
    process.exit(1);
  }

  const matrix: CapabilityMatrix = yaml.parse(fs.readFileSync(matrixPath, 'utf8'));
  log('INFO', `Loaded capability matrix with ${Object.keys(matrix.components).length} components`);

  // Setup Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('FAIL', 'Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  log('INFO', 'Connected to Supabase');

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  // Check each component
  for (const [componentName, config] of Object.entries(matrix.components)) {
    console.log(`\n📦 ${componentName}: ${config.description}`);

    // Check functions/endpoints
    console.log('  Functions:');
    for (const func of config.functions) {
      totalChecks++;
      const ok = await checkEndpoint(supabaseUrl, func);
      if (ok) {
        log('OK', `  ${func}`);
        passedChecks++;
      } else {
        log('FAIL', `  ${func}`);
        failedChecks++;
      }
    }

    // Check tables
    console.log('  Tables:');
    for (const table of config.tables) {
      totalChecks++;
      const ok = await checkTable(supabase, table);
      if (ok) {
        log('OK', `  ${table}`);
        passedChecks++;
      } else {
        log('FAIL', `  ${table}`);
        failedChecks++;
      }
    }

    // Check tools (informational)
    console.log('  Tools:');
    for (const tool of config.tools) {
      log('INFO', `  ${tool} (not validated)`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`  Total checks: ${totalChecks}`);
  log('OK', `  Passed: ${passedChecks}`);
  if (failedChecks > 0) {
    log('FAIL', `  Failed: ${failedChecks}`);
  }
  console.log(`  Success rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
  console.log('='.repeat(50) + '\n');

  if (failedChecks > 0) {
    log('FAIL', 'Some checks failed. Review the output above.');
    process.exit(1);
  } else {
    log('OK', 'All checks passed! AI wiring is healthy.');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

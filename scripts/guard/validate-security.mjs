#!/usr/bin/env node
/**
 * Security Validation CI Gate
 * Fails CI if:
 * - Any public table has RLS disabled (except allowlist)
 * - Any SECURITY DEFINER function lacks search_path=public
 * - Any policy/function uses NOT on jsonb without boolean coercion
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSecurityAudit() {
  console.log('🔒 Running security audit...\n');

  const auditSQL = await readFile(join(__dirname, 'security-audit.sql'), 'utf-8');
  
  // Split SQL into individual queries
  const queries = auditSQL
    .split(';')
    .map(q => q.trim())
    .filter(q => q && !q.startsWith('--'));

  let hasErrors = false;
  let hasWarnings = false;

  for (const query of queries) {
    if (!query || query.length < 10) continue;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error) {
        console.error(`❌ Query failed: ${error.message}`);
        hasErrors = true;
        continue;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          const check = row.audit_check || 'Unknown';
          
          if (check.startsWith('FAIL:')) {
            console.error(`❌ ${check}`);
            console.error(`   Table: ${row.table_name || row.schema_name + '.' + row.function_name}`);
            hasErrors = true;
          } else if (check.startsWith('WARN:')) {
            console.warn(`⚠️  ${check}`);
            console.warn(`   ${row.table_name || row.function_name}: ${row.policy_name || row.using_expression?.substring(0, 100)}`);
            hasWarnings = true;
          } else if (check === 'Summary') {
            console.log(`\n📊 Summary:`);
            console.log(`   Tables without RLS: ${row.tables_without_rls || 0}`);
            console.log(`   Security Definer Functions: ${row.security_definer_functions || 0}`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ Unexpected error: ${err.message}`);
      hasErrors = true;
    }
  }

  console.log('\n');

  if (hasErrors) {
    console.error('❌ SECURITY AUDIT FAILED - Critical issues found');
    process.exit(1);
  }

  if (hasWarnings) {
    console.warn('⚠️  SECURITY AUDIT PASSED WITH WARNINGS');
    process.exit(0);
  }

  console.log('✅ SECURITY AUDIT PASSED');
  process.exit(0);
}

// Run audit
runSecurityAudit().catch(err => {
  console.error('❌ Audit script error:', err);
  process.exit(1);
});

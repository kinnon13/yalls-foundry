#!/usr/bin/env node
/**
 * Gemini Audit Runner - Calls rocker-audit edge function with PR diff
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - PR_NUMBER
 * - REPO
 * - REF
 */

const fs = require('fs');
const path = require('path');

async function runAudit() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const PR_NUMBER = process.env.PR_NUMBER;
  const REPO = process.env.REPO;
  const REF = process.env.REF;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Read diff file
  const diffPath = path.join(process.cwd(), 'audit.diff');
  if (!fs.existsSync(diffPath)) {
    console.error('❌ audit.diff not found');
    process.exit(1);
  }

  const diff = fs.readFileSync(diffPath, 'utf8');
  
  if (diff.trim().length === 0) {
    console.log('ℹ️  No changes to audit (empty diff)');
    fs.writeFileSync('audit-results.json', JSON.stringify({
      success: true,
      findings: [],
      metadata: { prNumber: PR_NUMBER, repo: REPO, ref: REF }
    }));
    return;
  }

  console.log(`🔍 Auditing PR #${PR_NUMBER} (${diff.length} chars)`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/rocker-audit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prNumber: PR_NUMBER,
        diff,
        repo: REPO,
        ref: REF
      })
    });

    const results = await response.json();

    if (!response.ok) {
      console.error('❌ Audit API error:', response.status, results);
      fs.writeFileSync('audit-results.json', JSON.stringify({
        error: results.error || 'Unknown error',
        status: response.status
      }));
      process.exit(1);
    }

    console.log(`✅ Audit complete: ${results.findings?.length || 0} finding(s)`);
    
    // Write results for GitHub Action
    fs.writeFileSync('audit-results.json', JSON.stringify(results, null, 2));

    // Exit with non-zero if critical/high issues found (optional)
    const criticalCount = results.findings?.filter(
      f => f.severity === 'critical' || f.severity === 'high'
    ).length || 0;

    if (criticalCount > 0) {
      console.log(`⚠️  Found ${criticalCount} critical/high severity issue(s)`);
      // Uncomment to fail CI on critical issues:
      // process.exit(1);
    }

  } catch (err) {
    console.error('❌ Audit failed:', err);
    fs.writeFileSync('audit-results.json', JSON.stringify({
      error: err.message,
      stack: err.stack
    }));
    process.exit(1);
  }
}

runAudit();

#!/usr/bin/env -S deno run -A
/**
 * Dead Letter Queue Retry Script
 * Reprocesses failed jobs from the ingest_jobs table
 * 
 * Usage:
 *   deno run -A scripts/automation/retry-deadletter.ts [--dry-run] [--limit=10]
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  Deno.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse CLI args
const args = Deno.args
const isDryRun = args.includes('--dry-run')
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10

console.log('🔄 Dead Letter Queue Retry')
console.log('═'.repeat(50))
console.log(`Mode: ${isDryRun ? '🔍 DRY RUN' : '⚡ LIVE'}`)
console.log(`Limit: ${limit} jobs`)
console.log('')

// Find failed jobs with retry attempts < 3
const { data: failedJobs, error } = await supabase
  .from('ingest_jobs')
  .select('*')
  .eq('status', 'error')
  .lt('retry_count', 3)
  .order('created_at', { ascending: false })
  .limit(limit)

if (error) {
  console.error('❌ Error fetching failed jobs:', error)
  Deno.exit(1)
}

if (!failedJobs || failedJobs.length === 0) {
  console.log('✅ No failed jobs to retry')
  Deno.exit(0)
}

console.log(`Found ${failedJobs.length} failed jobs to retry:\n`)

for (const job of failedJobs) {
  console.log(`📋 Job ${job.id}:`)
  console.log(`   Kind: ${job.kind}`)
  console.log(`   Created: ${job.created_at}`)
  console.log(`   Retry Count: ${job.retry_count || 0}`)
  console.log(`   Last Error: ${job.error_message || 'N/A'}`)
  console.log('')

  if (!isDryRun) {
    // Reset job to pending with incremented retry count
    const { error: updateError } = await supabase
      .from('ingest_jobs')
      .update({
        status: 'pending',
        retry_count: (job.retry_count || 0) + 1,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)

    if (updateError) {
      console.error(`   ❌ Failed to reset job: ${updateError.message}`)
    } else {
      console.log(`   ✅ Job reset to pending`)
    }
    console.log('')
  }
}

if (isDryRun) {
  console.log('')
  console.log('🔍 Dry run complete - no changes made')
  console.log('   Run without --dry-run to actually retry these jobs')
} else {
  console.log('')
  console.log(`✅ Reset ${failedJobs.length} jobs to pending`)
  console.log('   Workers will process them automatically')
}

Deno.exit(0)

#!/usr/bin/env node
/**
 * Rocker Policy Engine
 * Enforces what User Rockers can see/do based on Admin Rocker rules
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(level, message) {
  const color = level === 'INFO' ? COLORS.blue :
                level === 'WARN' ? COLORS.yellow :
                level === 'ERROR' ? COLORS.red : COLORS.green;
  console.log(`${color}[${level}]${COLORS.reset} ${message}`);
}

async function enforcePolicy(userId, action, context) {
  log('INFO', `Checking policy for user ${userId}, action: ${action}`);

  // 1. Get user's role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  const userRole = profile?.role || 'user';

  // 2. Check if action is allowed for this role
  const { data: policies } = await supabase
    .from('ai_policy_rules')
    .select('*')
    .eq('role', userRole)
    .eq('action_type', action);

  if (!policies || policies.length === 0) {
    log('WARN', `No policy found for role ${userRole}, action ${action} - defaulting to DENY`);
    return { allowed: false, reason: 'No matching policy' };
  }

  const policy = policies[0];

  // 3. Check context-specific rules
  if (policy.conditions) {
    for (const [key, value] of Object.entries(policy.conditions)) {
      if (context[key] !== value) {
        log('WARN', `Condition failed: ${key} = ${context[key]} (expected: ${value})`);
        return { allowed: false, reason: `Condition failed: ${key}` };
      }
    }
  }

  // 4. Check throttling
  if (policy.rate_limit) {
    const { data: recentActions } = await supabase
      .from('ai_action_ledger')
      .select('id')
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', new Date(Date.now() - policy.rate_limit.window_ms).toISOString());

    if (recentActions && recentActions.length >= policy.rate_limit.max_requests) {
      log('ERROR', `Rate limit exceeded for user ${userId}, action ${action}`);
      return { allowed: false, reason: 'Rate limit exceeded' };
    }
  }

  log('SUCCESS', `Policy check passed for user ${userId}, action ${action}`);
  return { allowed: true, policy_id: policy.id };
}

// CLI usage
const [userId, action, ...contextArgs] = process.argv.slice(2);

if (!userId || !action) {
  console.log('Usage: node rocker-policy-engine.mjs <userId> <action> [key=value ...]');
  console.log('\nExample:');
  console.log('  node rocker-policy-engine.mjs user123 create_post content_type=video');
  process.exit(1);
}

const context = {};
contextArgs.forEach(arg => {
  const [key, value] = arg.split('=');
  context[key] = value;
});

enforcePolicy(userId, action, context).then(result => {
  console.log('\n' + '='.repeat(50));
  console.log('Policy Decision:', result.allowed ? '✅ ALLOWED' : '❌ DENIED');
  if (result.reason) console.log('Reason:', result.reason);
  if (result.policy_id) console.log('Policy ID:', result.policy_id);
  console.log('='.repeat(50) + '\n');
  process.exit(result.allowed ? 0 : 1);
});

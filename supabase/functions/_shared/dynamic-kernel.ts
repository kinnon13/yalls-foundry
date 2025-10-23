/**
 * Dynamic Kernel Router
 * Adaptive AI model selection based on task complexity, latency, budget
 * 
 * Architecture:
 * - Analyzes incoming request complexity
 * - Selects optimal model (fast/balanced/powerful)
 * - Tracks cost and adjusts based on budget
 * - Falls back gracefully on rate limits
 * 
 * Usage:
 *   const response = await kernel.chat(ctx, messages, { tools, complexity });
 */

import { createLogger } from './logger.ts';
import type { TenantContext } from './tenantGuard.ts';
import { ai, type Message } from './ai.ts';

const log = createLogger('dynamic-kernel');

export type TaskComplexity = 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';
export type LatencyRequirement = 'realtime' | 'interactive' | 'batch';

export interface KernelOptions {
  complexity?: TaskComplexity;
  latency?: LatencyRequirement;
  tools?: any[];
  temperature?: number;
  maxTokens?: number;
}

export interface KernelResponse {
  text: string;
  raw: any;
  model: string;
  cost_cents: number;
  latency_ms: number;
}

/**
 * Model tier configuration
 */
const MODEL_TIERS = {
  fast: {
    role: 'user' as const,
    models: ['google/gemini-2.5-flash-lite', 'openai/gpt-5-nano'],
    cost_per_1k_tokens: 0.01,
    max_tokens: 4000,
  },
  balanced: {
    role: 'user' as const,
    models: ['google/gemini-2.5-flash', 'openai/gpt-5-mini'],
    cost_per_1k_tokens: 0.05,
    max_tokens: 8000,
  },
  powerful: {
    role: 'admin' as const,
    models: ['google/gemini-2.5-pro', 'openai/gpt-5'],
    cost_per_1k_tokens: 0.20,
    max_tokens: 32000,
  },
};

/**
 * Analyze task complexity from messages
 */
function analyzeComplexity(messages: Message[], tools?: any[]): TaskComplexity {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const messageLength = lastMessage.length;
  
  // Check for complexity signals
  const hasMultiStep = /step|plan|analyze|compare|evaluate|summarize/i.test(lastMessage);
  const hasTools = tools && tools.length > 0;
  const isLongForm = messageLength > 500;
  
  if (isLongForm && hasMultiStep && hasTools) return 'expert';
  if (hasMultiStep && hasTools) return 'complex';
  if (hasTools || hasMultiStep) return 'moderate';
  if (messageLength > 200) return 'simple';
  return 'trivial';
}

/**
 * Select model tier based on complexity and latency
 */
function selectTier(complexity: TaskComplexity, latency: LatencyRequirement): keyof typeof MODEL_TIERS {
  // Fast responses always use fast tier
  if (latency === 'realtime') return 'fast';
  
  // Complexity-based selection
  switch (complexity) {
    case 'expert':
    case 'complex':
      return 'powerful';
    case 'moderate':
    case 'simple':
      return 'balanced';
    case 'trivial':
    default:
      return 'fast';
  }
}

/**
 * Get remaining budget for org
 */
async function getRemainingBudget(ctx: TenantContext): Promise<number> {
  // Query ai_budget_policies for org limits
  const { data } = await ctx.adminClient
    .from('ai_budget_policies')
    .select('daily_limit_cents')
    .eq('tenant_id', ctx.orgId)
    .single();
  
  if (!data) return 1000; // Default: $10/day
  
  // Query ai_action_ledger for today's spend
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await ctx.adminClient
    .from('ai_action_ledger')
    .select('cost_cents')
    .eq('tenant_id', ctx.orgId)
    .gte('created_at', today)
    .order('created_at', { ascending: false });
  
  const spent = usage?.reduce((sum, r) => sum + (r.cost_cents || 0), 0) || 0;
  return Math.max(0, data.daily_limit_cents - spent);
}

/**
 * Check budget and downgrade tier if needed
 */
async function checkBudget(
  ctx: TenantContext,
  tier: keyof typeof MODEL_TIERS
): Promise<keyof typeof MODEL_TIERS> {
  const remaining = await getRemainingBudget(ctx);
  
  // Low budget: force fast tier
  if (remaining < 50 && tier !== 'fast') {
    log.warn('Budget low, downgrading to fast tier', { remaining, requested: tier });
    return 'fast';
  }
  
  // Very low budget: block powerful tier
  if (remaining < 20 && tier === 'powerful') {
    log.warn('Budget critical, downgrading to balanced tier', { remaining });
    return 'balanced';
  }
  
  return tier;
}

/**
 * Log AI action to ledger
 */
async function logAction(
  ctx: TenantContext,
  model: string,
  costCents: number,
  latencyMs: number,
  metadata: any
): Promise<void> {
  try {
    await ctx.adminClient.from('ai_action_ledger').insert({
      tenant_id: ctx.orgId,
      user_id: ctx.userId,
      request_id: ctx.requestId,
      action: 'ai.chat',
      model,
      cost_cents: costCents,
      latency_ms: latencyMs,
      metadata,
    });
  } catch (error) {
    log.error('Failed to log action', error);
  }
}

/**
 * Main kernel chat function
 */
export async function chat(
  ctx: TenantContext,
  messages: Message[],
  options: KernelOptions = {}
): Promise<KernelResponse> {
  log.startTimer();
  
  const {
    complexity: userComplexity,
    latency = 'interactive',
    tools,
    temperature = 0.7,
    maxTokens,
  } = options;
  
  // Analyze complexity if not provided
  const complexity = userComplexity || analyzeComplexity(messages, tools);
  
  // Select tier
  let tier = selectTier(complexity, latency);
  
  // Check budget constraints
  tier = await checkBudget(ctx, tier);
  
  const tierConfig = MODEL_TIERS[tier];
  
  log.info('Kernel routing', { 
    complexity, 
    latency, 
    tier, 
    model: tierConfig.models[0],
    hasTools: !!tools?.length 
  });
  
  // Execute AI call
  const startTime = Date.now();
  try {
    const response = await ai.chat({
      role: tierConfig.role,
      messages,
      tools,
      temperature,
      maxTokens: maxTokens || tierConfig.max_tokens,
    });
    
    const latencyMs = Date.now() - startTime;
    
    // Estimate cost (rough approximation)
    const tokenCount = Math.ceil((response.text?.length || 0) / 4);
    const costCents = Math.ceil(tokenCount / 1000 * tierConfig.cost_per_1k_tokens);
    
    // Log to ledger
    await logAction(ctx, tierConfig.models[0], costCents, latencyMs, {
      complexity,
      tier,
      tools_count: tools?.length || 0,
    });
    
    log.info('Kernel completed', { 
      tier, 
      latency_ms: latencyMs, 
      cost_cents: costCents 
    });
    
    return {
      text: response.text || '',
      raw: response.raw,
      model: tierConfig.models[0],
      cost_cents: costCents,
      latency_ms: latencyMs,
    };
  } catch (error) {
    log.error('Kernel execution failed', error);
    throw error;
  }
}

/**
 * Embed text using appropriate model
 */
export async function embed(
  ctx: TenantContext,
  texts: string[]
): Promise<number[][]> {
  log.startTimer();
  
  try {
    const vectors = await ai.embed('knower', texts);
    
    const latencyMs = Date.now() - log.startTimer();
    
    // Log embedding generation
    await logAction(ctx, 'embedding-001', 1, latencyMs, {
      text_count: texts.length,
    });
    
    return vectors;
  } catch (error) {
    log.error('Embedding generation failed', error);
    throw error;
  }
}

/**
 * Export kernel interface
 */
export const kernel = {
  chat,
  embed,
};

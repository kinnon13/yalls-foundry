/**
 * Model Router
 * Intelligent model selection based on task complexity, budget, and latency requirements
 */

export type ModelPick = { 
  provider: 'grok' | 'openai' | 'local';
  model: string;
  maxTokens: number;
};

export type Task = { 
  kind: 'chat' | 'mdr' | 'extract' | 'verify';
  difficulty: 0 | 1 | 2;
  latencyMs?: number;
  tenantId?: string;
};

/**
 * Pick optimal model based on task requirements and budget
 */
export async function pickModel(task: Task, centsRemaining: number): Promise<ModelPick> {
  // Verification always uses fast, cheap model
  if (task.kind === 'verify') {
    return { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 4_000 };
  }

  // Simple extraction with low difficulty
  if (task.kind === 'extract' && task.difficulty === 0) {
    return { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 8_000 };
  }

  // Budget throttling - downgrade if low on funds
  if (centsRemaining < 50 && task.difficulty > 0) {
    return { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 8_000 };
  }

  // Default: Grok-first for robust reasoning
  return { provider: 'grok', model: 'grok-2', maxTokens: 32_000 };
}

/**
 * Get remaining budget for tenant (cents)
 */
export async function getCentsRemaining(tenantId: string): Promise<number> {
  // TODO: Query ai_budget_policies and ai_action_ledger
  // For now, return generous limit
  return 500;
}

/**
 * Check if budget allows operation
 */
export async function checkBudget(
  tenantId: string,
  estimatedCents: number,
  hardBlock: boolean = true
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  const remaining = await getCentsRemaining(tenantId);
  
  if (remaining <= 0 && hardBlock) {
    return {
      allowed: false,
      remaining: 0,
      message: 'Daily budget exhausted. Upgrade plan or wait until reset.'
    };
  }

  if (remaining < estimatedCents && hardBlock) {
    return {
      allowed: false,
      remaining,
      message: `Insufficient budget. Need ${estimatedCents}¢, have ${remaining}¢.`
    };
  }

  return { allowed: true, remaining };
}

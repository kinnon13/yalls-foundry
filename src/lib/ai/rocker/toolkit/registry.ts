/**
 * Tool Registry
 * Production-grade tool registration with permissions and rate limits
 */

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  requiredPermissions?: string[];
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
  execute: (params: any) => Promise<any>;
}

export interface ToolCallLog {
  toolId: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();
  private callLogs = new Map<string, ToolCallLog[]>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  async execute(toolId: string, params: any, userId?: string): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    const tool = this.tools.get(toolId);
    
    if (!tool) {
      return { success: false, error: `Tool ${toolId} not found` };
    }

    // Rate limit check
    if (tool.rateLimit && userId) {
      const isAllowed = this.checkRateLimit(toolId, userId, tool.rateLimit);
      if (!isAllowed) {
        return { success: false, error: 'Rate limit exceeded' };
      }
    }

    try {
      const result = await tool.execute(params);
      this.logCall(toolId, userId, true);
      return { success: true, result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logCall(toolId, userId, false, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  private checkRateLimit(
    toolId: string,
    userId: string,
    limit: { maxCalls: number; windowMs: number }
  ): boolean {
    const key = `${toolId}:${userId}`;
    const logs = this.callLogs.get(key) || [];
    const now = Date.now();
    const recentCalls = logs.filter(log => now - log.timestamp < limit.windowMs);
    
    return recentCalls.length < limit.maxCalls;
  }

  private logCall(toolId: string, userId: string | undefined, success: boolean, error?: string): void {
    if (!userId) return;
    
    const key = `${toolId}:${userId}`;
    const logs = this.callLogs.get(key) || [];
    logs.push({ toolId, timestamp: Date.now(), success, error });
    
    // Keep only last 100 logs per tool per user
    if (logs.length > 100) {
      logs.shift();
    }
    
    this.callLogs.set(key, logs);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

// Global singleton
export const toolRegistry = new ToolRegistry();

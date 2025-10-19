/**
 * Adapter Interface for App Integrations
 */

export interface AdapterContext {
  userId: string;
  contextType: string;
  contextId: string;
  sessionId?: string;
}

export interface AdapterResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AppAdapter {
  execute(
    appId: string,
    actionId: string,
    params: Record<string, any>,
    ctx: AdapterContext
  ): Promise<AdapterResult>;
}

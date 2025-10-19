/**
 * Kernel Types
 * Core contracts for Rocker OS
 */

export type AppId = string;
export type ActionId = string;
export type EventId = string;
export type IntentId = string;

export type AppContext = 'user' | 'business' | 'farm' | 'stallion' | 'producer';

export type ParamSchema = {
  [key: string]: 'string' | 'number' | 'boolean' | 'uuid' | 'datetime' | 'string?' | 'number?' | 'uuid?' | 'datetime?';
};

export interface AppAction {
  params: ParamSchema;
  permissions?: string[];
  mockDelay?: number;
}

export interface AppEvent {
  properties: ParamSchema;
}

export interface AppContract {
  id: AppId;
  version: string;
  name: string;
  description?: string;
  intents: IntentId[];
  actions: Record<ActionId, AppAction>;
  events: Record<EventId, AppEvent>;
  contexts: AppContext[];
  capabilities: string[];
  permissions?: Record<string, string[]>;
  ui: {
    defaultMode: 'overlay' | 'panel';
    icon?: string;
  };
}

export interface CommandInvocation {
  appId: AppId;
  actionId: ActionId;
  params: Record<string, any>;
  context: {
    userId: string;
    contextType: AppContext;
    contextId: string;
  };
  idempotencyKey?: string;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
}

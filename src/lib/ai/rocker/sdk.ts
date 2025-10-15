/**
 * Rocker SDK
 * 
 * Single unified SDK for all Rocker interactions.
 * Provides simple, consistent API for features to integrate with Rocker.
 */

import { rockerBus, logRockerEvent, RockerEvent, RockerAction } from './bus';
import type { RockerEventType, RockerActionType } from './bus';

// Re-export for convenience
export { rockerBus } from './bus';
export type { RockerEvent, RockerAction } from './bus';

/**
 * Rocker SDK Class
 * 
 * High-level interface for feature integration.
 */
class RockerSDK {
  /**
   * Log any user action to Rocker
   */
  async logEvent(
    type: RockerEventType,
    userId: string,
    payload: Record<string, any>,
    sessionId?: string
  ): Promise<void> {
    await logRockerEvent(type, userId, payload, sessionId);
  }

  /**
   * Subscribe to Rocker suggestions for a specific action type
   */
  onSuggestion(
    actionType: RockerActionType,
    handler: (action: RockerAction) => void
  ): () => void {
    return rockerBus.onAction((action) => {
      if (action.type === actionType) {
        handler(action);
      }
    });
  }

  /**
   * Subscribe to all Rocker actions
   */
  onAction(handler: (action: RockerAction) => void): () => void {
    return rockerBus.onAction(handler);
  }

  /**
   * Get Rocker's context for a user (memory + knowledge)
   */
  async getContext(userId: string): Promise<{
    memory: Array<{ key: string; value: any }>;
    knowledge: Array<{ key: string; value: any }>;
  }> {
    // TODO: Query ai_user_memory and ai_global_knowledge
    return {
      memory: [],
      knowledge: [],
    };
  }

  /**
   * Ask Rocker a direct question (chat interface)
   */
  async ask(
    userId: string,
    question: string,
    context?: Record<string, any>
  ): Promise<{ response: string; actions?: RockerAction[] }> {
    // TODO: Call rocker-chat function
    return {
      response: 'Rocker response here',
      actions: [],
    };
  }

  /**
   * Request Rocker to analyze something
   */
  async analyze(
    userId: string,
    type: 'media' | 'profile' | 'event' | 'listing',
    targetId: string
  ): Promise<{ insights: Record<string, any>; suggestions: RockerAction[] }> {
    // TODO: Call appropriate analysis function
    return {
      insights: {},
      suggestions: [],
    };
  }
}

// ============= Singleton Export =============

export const rocker = new RockerSDK();

// ============= Convenience Exports =============

export { 
  logRockerEvent,
  type RockerEventType,
  type RockerActionType,
} from './bus';

// Export all integrations
export * from './integrations';

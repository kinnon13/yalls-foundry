/**
 * Rocker Event Bus
 * 
 * Central pub/sub message bus for the entire Y'alls platform.
 * Every feature emits rocker_event → Rocker interprets → responds with rocker_action.
 */

import { supabase } from '@/integrations/supabase/client';
import { resolveTenantId } from '@/lib/tenancy/context';
import { log } from '@/lib/logger';

// ============= Event Types =============

export type RockerEventType = 
  | 'user.upload.media'
  | 'user.create.profile'
  | 'user.update.profile'
  | 'user.claim.profile'
  | 'user.view.profile'
  | 'user.create.post'
  | 'user.save.post'
  | 'user.reshare.post'
  | 'user.create.event'
  | 'user.register.event'
  | 'user.create.listing'
  | 'user.view.listing'
  | 'user.purchase.listing'
  | 'user.message.send'
  | 'user.search'
  | 'system.consent.granted'
  | 'system.error'
  | 'user.create.business'
  | 'user.create.crm_contact'
  | 'user.create.calendar'
  | 'user.create.calendar_event'
  | 'user.share.calendar'
  | 'user.create.calendar_collection'
  | 'business.create'
  | 'business.lead.created'
  | 'mlm.referral.created'
  | 'mlm.payout.triggered';

export type RockerActionType =
  | 'suggest.tag'
  | 'suggest.link'
  | 'suggest.follow'
  | 'suggest.listing'
  | 'suggest.event'
  | 'notify.user'
  | 'update.memory'
  | 'create.proposal'
  | 'verify.data'
  | 'analyze.media'
  | 'optimize.search';

export type RockerEvent = {
  type: RockerEventType;
  userId: string;
  tenantId: string;
  payload: Record<string, any>;
  timestamp: string;
  sessionId?: string;
};

export type RockerAction = {
  type: RockerActionType;
  targetUserId: string;
  payload: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: string;
};

// ============= Event Bus =============

class RockerBus {
  private listeners: Map<RockerEventType, Set<(event: RockerEvent) => void>> = new Map();
  private actionListeners: Set<(action: RockerAction) => void> = new Set();

  /**
   * Emit a Rocker event (called by features)
   */
  async emit(event: Omit<RockerEvent, 'timestamp'>): Promise<void> {
    const fullEvent: RockerEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Log to database for audit trail
    try {
      await supabase.from('admin_audit_log').insert({
        action: `rocker.event.${event.type}`,
        actor_user_id: event.userId,
        metadata: {
          event_type: event.type,
          payload: event.payload,
          session_id: event.sessionId,
        },
      });
    } catch (err) {
      console.error('[RockerBus] Failed to log event:', err);
    }

    // Notify in-memory listeners (real-time)
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(fullEvent);
        } catch (err) {
          console.error(`[RockerBus] Handler error for ${event.type}:`, err);
        }
      });
    }

    // Trigger Rocker AI processing (via edge function)
    this.processWithRocker(fullEvent);
  }

  /**
   * Subscribe to specific event type
   */
  on(eventType: RockerEventType, handler: (event: RockerEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to Rocker actions (UI components listen here)
   */
  onAction(handler: (action: RockerAction) => void): () => void {
    this.actionListeners.add(handler);
    return () => {
      this.actionListeners.delete(handler);
    };
  }

  /**
   * Emit a Rocker action (called by Rocker AI)
   */
  async emitAction(action: RockerAction): Promise<void> {
    // Notify UI components
    this.actionListeners.forEach(handler => {
      try {
        handler(action);
      } catch (err) {
        console.error('[RockerBus] Action handler error:', err);
      }
    });

    // Persist action for later retrieval
    try {
      const tenantId = await resolveTenantId(action.targetUserId);
      await supabase.from('ai_proposals').insert({
        type: action.type,
        user_id: action.targetUserId,
        tenant_id: tenantId,
        payload: action.payload,
        due_at: action.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (err) {
      log.error('[RockerBus] Failed to persist action', { error: err });
    }
  }

  /**
   * Send event to Rocker AI for processing
   */
  private async processWithRocker(event: RockerEvent): Promise<void> {
    try {
      // Call Rocker chat function with event context
      const { data, error } = await supabase.functions.invoke('rocker-chat-simple', {
        body: {
          message: `Process event: ${event.type}. Payload: ${JSON.stringify(event.payload)}`,
          context: 'event_processing',
        },
      });

      if (error) throw error;

      // If Rocker suggests actions, emit them
      if (data?.actions) {
        for (const action of data.actions) {
          await this.emitAction({
            ...action,
            targetUserId: event.userId,
          });
        }
      }
    } catch (err) {
      console.error('[RockerBus] Failed to process with Rocker:', err);
    }
  }
}

// ============= Singleton Instance =============

export const rockerBus = new RockerBus();

// ============= Helper Functions =============

/**
 * Log a Rocker event (shorthand)
 */
export async function emitRockerEvent(
  type: RockerEventType,
  userId: string,
  payload: Record<string, unknown>,
  sessionId?: string
): Promise<void> {
  const tenantId = await resolveTenantId(userId);
  await rockerBus.emit({
    type,
    userId,
    tenantId,
    payload,
    sessionId,
  });
}

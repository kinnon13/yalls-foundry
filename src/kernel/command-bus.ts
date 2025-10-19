/**
 * Command Bus
 * Central dispatch for all app actions
 */

import type { CommandInvocation, CommandResult, AppContract } from './types';
import { rocker } from '@/lib/rocker/event-bus';
import { contractRegistry } from './contract-registry';
import { mockAdapter } from '@/mocks/adapter';
import { isDemo } from '@/lib/env';

class CommandBus {
  private adapters: Map<string, any> = new Map();
  private idempotencyCache: Map<string, CommandResult> = new Map();

  /**
   * Register a real adapter for an app
   */
  registerAdapter(appId: string, adapter: any): void {
    this.adapters.set(appId, adapter);
  }

  /**
   * Invoke an action
   */
  async invoke(invocation: CommandInvocation): Promise<CommandResult> {
    const { appId, actionId, params, context, idempotencyKey } = invocation;

    // Idempotency check
    if (idempotencyKey) {
      const cached = this.idempotencyCache.get(idempotencyKey);
      if (cached) {
        rocker.emit('command_idempotent', { metadata: { appId, actionId, idempotencyKey } });
        return cached;
      }
    }

    // Get contract
    const contract = contractRegistry.get(appId);
    if (!contract) {
      const error = `App contract not found: ${appId}`;
      rocker.emit('command_error', { metadata: { appId, actionId, error } });
      return { success: false, error };
    }

    // Validate action exists
    const action = contract.actions[actionId];
    if (!action) {
      const error = `Action not found: ${appId}.${actionId}`;
      rocker.emit('command_error', { metadata: { appId, actionId, error } });
      return { success: false, error };
    }

    // Validate params (basic)
    const validation = this.validateParams(params, action.params);
    if (!validation.valid) {
      rocker.emit('command_validation_error', { metadata: { appId, actionId, errors: validation.errors } });
      return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
    }

    // Check permissions (stub for now)
    if (action.permissions && action.permissions.length > 0) {
      // TODO: Real permission check via policy-guard
      console.log('[CommandBus] Permission check:', action.permissions);
    }

    rocker.emit('command_invoked', { metadata: { appId, actionId, params, context } });

    try {
      // Use mock or real adapter
      const adapter = isDemo() ? mockAdapter : (this.adapters.get(appId) || mockAdapter);
      const result = await adapter.execute(appId, actionId, params, context);

      rocker.emit('command_success', { metadata: { appId, actionId, result } });

      // Cache if idempotent
      if (idempotencyKey) {
        this.idempotencyCache.set(idempotencyKey, result);
        setTimeout(() => this.idempotencyCache.delete(idempotencyKey), 60000); // 1min TTL
      }

      // Log to ledger (stub)
      this.logToLedger({ appId, actionId, params, context, result });

      return result;
    } catch (e: any) {
      const error = e.message || 'Unknown error';
      rocker.emit('command_error', { metadata: { appId, actionId, error } });
      return { success: false, error };
    }
  }

  /**
   * Validate params against schema
   */
  private validateParams(params: Record<string, any>, schema: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, type] of Object.entries(schema)) {
      const optional = type.endsWith('?');
      const baseType = optional ? type.slice(0, -1) : type;
      const value = params[key];

      if (value === undefined || value === null) {
        if (!optional) {
          errors.push(`Missing required param: ${key}`);
        }
        continue;
      }

      // Basic type checks
      if (baseType === 'string' && typeof value !== 'string') {
        errors.push(`${key} must be string`);
      } else if (baseType === 'number' && typeof value !== 'number') {
        errors.push(`${key} must be number`);
      } else if (baseType === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${key} must be boolean`);
      } else if (baseType === 'uuid' && typeof value !== 'string') {
        errors.push(`${key} must be uuid string`);
      } else if (baseType === 'datetime' && typeof value !== 'string') {
        errors.push(`${key} must be datetime string`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Log to AI ledger (stub)
   */
  private logToLedger(data: any): void {
    // TODO: Write to ai_action_ledger table
    console.log('[CommandBus] Ledger entry:', data);
  }
}

export const commandBus = new CommandBus();

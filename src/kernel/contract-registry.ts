/**
 * Contract Registry
 * Central repository for all app contracts
 */

import type { AppContract, AppId } from './types';

class ContractRegistry {
  private contracts: Map<AppId, AppContract> = new Map();

  /**
   * Register a contract
   */
  register(contract: AppContract): void {
    this.contracts.set(contract.id, contract);
  }

  /**
   * Get a contract
   */
  get(appId: AppId): AppContract | undefined {
    return this.contracts.get(appId);
  }

  /**
   * Get all contracts
   */
  getAll(): AppContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Find contracts by intent
   */
  findByIntent(intent: string): AppContract[] {
    return this.getAll().filter(c => c.intents.includes(intent));
  }

  /**
   * Find contracts by context
   */
  findByContext(context: string): AppContract[] {
    return this.getAll().filter(c => c.contexts.includes(context as any));
  }
}

export const contractRegistry = new ContractRegistry();

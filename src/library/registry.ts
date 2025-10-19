/**
 * Library Registry
 * Reads all contracts and lazy UI components
 */

import { lazy } from 'react';
import type { AppContract } from '@/kernel/types';
import { contractRegistry } from '@/kernel/contract-registry';

export interface LibraryEntry {
  contract: AppContract;
  entryComponent: React.LazyExoticComponent<React.ComponentType<any>>;
  panelComponent?: React.LazyExoticComponent<React.ComponentType<any>>;
}

class LibraryRegistry {
  private entries: Map<string, LibraryEntry> = new Map();

  /**
   * Register an app with its UI components
   */
  register(appId: string, entryPath: string, panelPath?: string): void {
    const contract = contractRegistry.get(appId);
    if (!contract) {
      console.warn(`[Library] Contract not found for app: ${appId}`);
      return;
    }

    this.entries.set(appId, {
      contract,
      entryComponent: lazy(() => import(`../apps/${appId}/${entryPath}`)),
      panelComponent: panelPath ? lazy(() => import(`../apps/${appId}/${panelPath}`)) : undefined,
    });
  }

  /**
   * Get library entry
   */
  get(appId: string): LibraryEntry | undefined {
    return this.entries.get(appId);
  }

  /**
   * Get all entries
   */
  getAll(): LibraryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Search across apps, actions, and entities
   */
  search(query: string): LibraryEntry[] {
    const q = query.toLowerCase();
    return this.getAll().filter(entry => {
      const { contract } = entry;
      return (
        contract.name.toLowerCase().includes(q) ||
        contract.description?.toLowerCase().includes(q) ||
        contract.intents.some(intent => intent.includes(q)) ||
        Object.keys(contract.actions).some(action => action.includes(q))
      );
    });
  }

  /**
   * Get entries by context
   */
  findByContext(context: string): LibraryEntry[] {
    return this.getAll().filter(entry => entry.contract.contexts.includes(context as any));
  }
}

export const libraryRegistry = new LibraryRegistry();

// Auto-register apps (would normally be auto-discovered)
// For now, register the ones we have contracts for
libraryRegistry.register('crm', 'Entry', 'Panel');
libraryRegistry.register('marketplace', 'Entry');
libraryRegistry.register('messages', 'Entry', 'Panel');
libraryRegistry.register('calendar', 'Entry');
libraryRegistry.register('discover', 'Entry');
libraryRegistry.register('listings', 'Entry');
libraryRegistry.register('events', 'Entry');
libraryRegistry.register('earnings', 'Entry');
libraryRegistry.register('incentives', 'Entry');
libraryRegistry.register('farm-ops', 'Entry');
libraryRegistry.register('activity', 'Entry', 'Panel');
libraryRegistry.register('favorites', 'Entry', 'Panel');
libraryRegistry.register('analytics', 'Entry');

/**
 * Adapter Registry
 * Registers all real Supabase adapters
 */

import { crmAdapter } from './crm.supabase';
import { marketplaceAdapter } from './marketplace.supabase';
import { eventsAdapter } from './events.supabase';
import type { AppAdapter } from './types';

const adapters = new Map<string, AppAdapter>();

export function registerAdapter(appId: string, adapter: AppAdapter) {
  adapters.set(appId, adapter);
  console.log(`[Adapter Registry] Registered: ${appId}`);
}

export function getAdapter(appId: string): AppAdapter | undefined {
  return adapters.get(appId);
}

export function initializeAdapters() {
  registerAdapter('crm', crmAdapter);
  registerAdapter('marketplace', marketplaceAdapter);
  registerAdapter('events', eventsAdapter);
  
  console.log(`[Adapter Registry] Initialized ${adapters.size} adapters`);
}

export { crmAdapter, marketplaceAdapter, eventsAdapter };

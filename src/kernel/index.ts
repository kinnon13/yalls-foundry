/**
 * Rocker OS Kernel
 * Central exports for kernel modules
 */

export * from './types';
export { commandBus } from './command-bus';
export { contractRegistry } from './contract-registry';
export { policyGuard } from './policy-guard';
export { useContextManager } from './context-manager';
export { useDesignLock } from './design-lock';

// Register contracts
import { crmContract } from '@/apps/crm/contract';
import { marketplaceContract } from '@/apps/marketplace/contract';
import { messagesContract } from '@/apps/messages/contract';
import { calendarContract } from '@/apps/calendar/contract';
import { discoverContract } from '@/apps/discover/contract';
import { listingsContract } from '@/apps/listings/contract';
import { eventsContract } from '@/apps/events/contract';
import { earningsContract } from '@/apps/earnings/contract';
import { incentivesContract } from '@/apps/incentives/contract';
import { farmOpsContract } from '@/apps/farm-ops/contract';
import { activityContract } from '@/apps/activity/contract';
import { favoritesContract } from '@/apps/favorites/contract';
import { analyticsContract } from '@/apps/analytics/contract';
import { contractRegistry } from './contract-registry';

// Auto-register on import
contractRegistry.register(crmContract);
contractRegistry.register(marketplaceContract);
contractRegistry.register(messagesContract);
contractRegistry.register(calendarContract);
contractRegistry.register(discoverContract);
contractRegistry.register(listingsContract);
contractRegistry.register(eventsContract);
contractRegistry.register(earningsContract);
contractRegistry.register(incentivesContract);
contractRegistry.register(farmOpsContract);
contractRegistry.register(activityContract);
contractRegistry.register(favoritesContract);
contractRegistry.register(analyticsContract);

console.log('[Kernel] Registered contracts:', contractRegistry.getAll().map(c => c.id));

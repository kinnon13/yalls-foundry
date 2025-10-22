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

// Register contracts with extended kernel type
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

// Import simple contracts and convert them
import yallbraryContractSimple from '@/apps/yallbrary/contract';
import cartContractSimple from '@/apps/cart/contract';
import ordersContractSimple from '@/apps/orders/contract';
import notificationsContractSimple from '@/apps/notifications/contract';
import profileContractSimple from '@/apps/profile/contract';
import entitiesContractSimple from '@/apps/entities/contract';
import mlmContractSimple from '@/apps/mlm/contract';
import businessContractSimple from '@/apps/business/contract';
import producerContractSimple from '@/apps/producer/contract';
import settingsContractSimple from '@/apps/settings/contract';
import overviewContractSimple from '@/apps/overview/contract';
import rockerContractSimple from '@/apps/rocker/contract';
import adminRockerContractSimple from '@/apps/admin-rocker/contract';
import andyContractSimple from '@/apps/andy/contract';

import { contractRegistry } from './contract-registry';
import type { AppContract } from './types';

// Helper to convert simple contracts to extended format
function toExtendedContract(simple: any): AppContract {
  return {
    id: simple.id,
    version: '1.0.0',
    name: simple.title,
    description: `${simple.title} app`,
    intents: [],
    actions: {},
    events: {},
    contexts: ['user'],
    capabilities: ['view'],
    ui: {
      defaultMode: 'overlay',
      icon: simple.id,
    },
  };
}

// Auto-register extended contracts
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

// Register converted simple contracts
contractRegistry.register(toExtendedContract(yallbraryContractSimple));
contractRegistry.register(toExtendedContract(cartContractSimple));
contractRegistry.register(toExtendedContract(ordersContractSimple));
contractRegistry.register(toExtendedContract(notificationsContractSimple));
contractRegistry.register(toExtendedContract(profileContractSimple));
contractRegistry.register(toExtendedContract(entitiesContractSimple));
contractRegistry.register(toExtendedContract(mlmContractSimple));
contractRegistry.register(toExtendedContract(businessContractSimple));
contractRegistry.register(toExtendedContract(producerContractSimple));
contractRegistry.register(toExtendedContract(settingsContractSimple));
contractRegistry.register(toExtendedContract(overviewContractSimple));
contractRegistry.register(toExtendedContract(rockerContractSimple));
contractRegistry.register(toExtendedContract(adminRockerContractSimple));
contractRegistry.register(toExtendedContract(andyContractSimple));

console.log('[Kernel] Registered contracts:', contractRegistry.getAll().map(c => c.id));

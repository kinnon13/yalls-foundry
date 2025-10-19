/**
 * Rocker OS Kernel
 * Central exports for kernel modules
 */

export * from './types';
export { commandBus } from './command-bus';
export { contractRegistry } from './contract-registry';
export { policyGuard } from './policy-guard';
export { useContextManager } from './context-manager';

// Register contracts
import { crmContract } from '@/apps/crm/contract';
import { marketplaceContract } from '@/apps/marketplace/contract';
import { messagesContract } from '@/apps/messages/contract';
import { contractRegistry } from './contract-registry';

// Auto-register on import
contractRegistry.register(crmContract);
contractRegistry.register(marketplaceContract);
contractRegistry.register(messagesContract);

console.log('[Kernel] Registered contracts:', contractRegistry.getAll().map(c => c.id));

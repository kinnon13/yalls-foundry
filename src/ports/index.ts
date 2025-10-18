/**
 * Adapter Registry
 * Central export point for all data adapters
 */

import { buildAdapters } from './buildAdapters';
import { env } from '@/lib/env';

const MODE = env.PORTS_MODE;
const adapters = buildAdapters(MODE);

// Export adapters
export const ProfilePins = adapters.profilePins;
export const Favorites = adapters.favorites;
export const Reposts = adapters.reposts;
export const LinkedAccounts = adapters.linkedAccounts;
export const EntityEdges = adapters.entityEdges;

// Export for debugging/observability
export const ADAPTER_MODE = MODE;

// Re-export types
export * from './profilePins';
export * from './favorites';
export * from './reposts';
export * from './linkedAccounts';
export * from './entityEdges';

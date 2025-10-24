/**
 * Yalls-Business Barrel Export
 * Exports only Entry/Panel components to prevent cross-app imports
 */

export { default as BusinessEntry } from './Entry';
export { default as BusinessPanel } from './Panel';

// Do NOT export services, utils, or internal components
// Apps must use @/lib/shared for cross-cutting concerns

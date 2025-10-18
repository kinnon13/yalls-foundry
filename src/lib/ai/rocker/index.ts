/**
 * Rocker - AI Observability for Section-Level Telemetry
 * 
 * Public API for Rocker Everywhere integration
 */

export { RockerProvider, useRocker } from './RockerProvider';
export { RockerHint } from './RockerHint';
export { RockerWhy } from './RockerWhy';
export { RockerTray } from './RockerTray';

// Legacy exports for backwards compatibility with chat system
export { useRockerGlobal, RockerProvider as RockerChatProvider } from './RockerChatProvider';
export type { RockerContextValue } from './RockerChatProvider';

/**
 * Rocker - AI Observability for Section-Level Telemetry
 * 
 * Public API for Rocker Everywhere integration
 */

export { RockerProvider, useRocker } from './RockerProvider';
export { RockerHint } from './RockerHint';
export { RockerWhy } from './RockerWhy';
export { RockerTray } from './RockerTray';

// Chat-specific exports (use unique names to avoid confusion)
export { 
  useRockerGlobal, 
  RockerProvider as RockerChatProvider 
} from './RockerChatProvider';
export type { RockerContextValue } from './RockerChatProvider';

// NOTE: Import these with explicit aliases to avoid confusion:
// import { RockerProvider as RockerCore } from '@/lib/ai/rocker/RockerProvider';
// import { RockerChatProvider } from '@/lib/ai/rocker';

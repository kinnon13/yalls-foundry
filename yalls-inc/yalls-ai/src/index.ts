/**
 * Role: Yalls AI barrel export - public API
 * Path: yalls-inc/yalls-ai/src/index.ts
 */

export { YallsAIContract } from './contract';
export { AINudge } from './components/AINudge';
export {
  getCapabilities,
  executeQuery,
  suggestFollow,
  monetizeIdeas,
  forecastRevenue,
} from './services/tiered-kernel';
export type { Role, Capability, AIQuery, AIResponse } from '../libs/models/tiered.model';
export { CAPABILITIES } from '../libs/models/tiered.model';

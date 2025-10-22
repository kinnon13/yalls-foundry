/**
 * Fairness & Quota Types
 */

export interface TenantQuota {
  tenant_id: string;
  max_concurrent_jobs: number;
  current_jobs: number;
}

export interface FairnessPolicy {
  maxPerTenant: number;
  roundRobinWindow: number;
}

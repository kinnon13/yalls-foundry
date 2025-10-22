/**
 * Autoscaler Types
 */

export interface ScaleDecision {
  pool: string;
  from: number;
  to: number;
  reason: 'high_load' | 'low_load' | 'burst';
}

export interface ScalingPolicy {
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownMs: number;
}

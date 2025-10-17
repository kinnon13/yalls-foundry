/**
 * Feature Kernel Types
 * 
 * Type definitions for the feature-islands architecture
 */

import type { ComponentType } from 'react';
import type { z } from 'zod';

export type FeatureProps = Record<string, unknown>;

export interface FeatureDef {
  id: string;
  title: string;
  description?: string;
  version: string;
  loader: () => Promise<{ default: ComponentType<FeatureProps> }>;
  schema: z.ZodTypeAny;
  defaults?: FeatureProps;
  capabilities?: string[];
  icon?: ComponentType<{ className?: string }>;
}

export interface FeatureContext {
  featureId: string;
  props: FeatureProps;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

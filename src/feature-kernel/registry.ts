/**
 * Feature Registry
 * 
 * Canonical source of truth for all dashboard features
 */

import { z } from 'zod';
import { CheckCircle, Calendar, DollarSign } from 'lucide-react';
import type { FeatureDef } from './types';

export const featureRegistry: Record<string, FeatureDef> = {
  approvals: {
    id: 'approvals',
    title: 'Feed Approvals',
    description: 'Review and approve pending content',
    version: '1',
    loader: () => import('../features/approvals/Feature'),
    schema: z.object({ 
      entity: z.string().uuid().optional(),
      filter: z.enum(['all', 'pending', 'approved', 'rejected']).default('pending'),
    }),
    defaults: { filter: 'pending' },
    capabilities: ['approve', 'reject', 'hide', 'export'],
    icon: CheckCircle,
    enabled: true,
    requires: ['approvals'],
  },
  calendar: {
    id: 'calendar',
    title: 'Calendar',
    description: 'View and manage your schedule',
    version: '1',
    loader: () => import('../features/calendar/Feature'),
    schema: z.object({ 
      view: z.enum(['public', 'private']).default('public'),
      range: z.string().default('30d'),
    }),
    defaults: { view: 'public', range: '30d' },
    capabilities: ['view', 'create', 'edit', 'delete'],
    icon: Calendar,
    enabled: true,
    requires: ['calendar'],
  },
  earnings: {
    id: 'earnings',
    title: 'Earnings',
    description: 'Track your earnings and payouts',
    version: '1',
    loader: () => import('../features/earnings/Feature'),
    schema: z.object({ 
      tab: z.enum(['summary', 'missed', 'history']).default('summary'),
    }),
    defaults: { tab: 'summary' },
    capabilities: ['view', 'export'],
    icon: DollarSign,
    enabled: true,
    requires: ['earnings'],
  },
};

export function getFeature(id: string): FeatureDef | undefined {
  return featureRegistry[id];
}

export function getAllFeatures(): FeatureDef[] {
  return Object.values(featureRegistry);
}

export function getEnabledFeatures(): FeatureDef[] {
  return Object.values(featureRegistry).filter(f => {
    if (f.enabled === undefined || f.enabled === true) return true;
    if (f.enabled === false) return false;
    // Rollout percentage: deterministic per-session
    const roll = Math.abs(hashCode(f.id)) % 100;
    return roll < f.enabled;
  });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function getFeatureCapabilities(id: string): string[] {
  return featureRegistry[id]?.capabilities ?? [];
}

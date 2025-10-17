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
  },
};

export function getFeature(id: string): FeatureDef | undefined {
  return featureRegistry[id];
}

export function getAllFeatures(): FeatureDef[] {
  return Object.values(featureRegistry);
}

export function getFeatureCapabilities(id: string): string[] {
  return featureRegistry[id]?.capabilities ?? [];
}

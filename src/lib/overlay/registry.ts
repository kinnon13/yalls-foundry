/**
 * Overlay Registry
 * Typed registry mapping AppId keys to lazy-loaded Entry components
 * 
 * IMPORTANT:
 * - These keys must match AppId union in @/apps/types
 * - Each entry loads the app's Entry component (overlay mode)
 * - Changes here must stay in sync with AppId type
 */

import { lazy } from 'react';
import type { OverlayConfig } from './types';
import type { AppId } from '@/apps/types';

// Export OverlayKey for backwards compatibility
export type OverlayKey = AppId;

export const OVERLAY_REGISTRY: Record<AppId, OverlayConfig> = {
  // 🟢 Core commerce first
  cart:         { key: 'cart',         title: 'Cart',         component: lazy(() => import('@/apps/cart/Entry')) },
  orders:       { key: 'orders',       title: 'Orders',       component: lazy(() => import('@/apps/orders/Entry')) },
  notifications:{ key: 'notifications',title: 'Notifications',component: lazy(() => import('@/apps/notifications/Entry')) },

  // 🟢 Profiles & graph
  profile:      { key: 'profile',      title: 'Profile',      component: lazy(() => import('@/apps/profile/Entry')) },
  entities:     { key: 'entities',     title: 'Entities',     component: lazy(() => import('@/apps/entities/Entry')) },

  // 🟢 Growth & settings
  mlm:          { key: 'mlm',          title: 'Affiliate Network', component: lazy(() => import('@/apps/mlm/Entry')) },
  settings:     { key: 'settings',     title: 'Settings',     component: lazy(() => import('@/apps/settings/Entry')) },
  overview:     { key: 'overview',     title: 'Owner HQ',     component: lazy(() => import('@/apps/overview/Entry')) },

  // 🟡 Rest exist (scaffolded) - will wire later
  crm:          { key: 'crm',          title: 'CRM',          component: lazy(() => import('@/apps/crm/Entry')) },
  marketplace:  { key: 'marketplace',  title: 'Marketplace',  component: lazy(() => import('@/apps/marketplace/Entry')) },
  messages:     { key: 'messages',     title: 'Messages',     component: lazy(() => import('@/apps/messages/Entry')) },
  calendar:     { key: 'calendar',     title: 'Calendar',     component: lazy(() => import('@/apps/calendar/Entry')) },
  discover:     { key: 'discover',     title: 'Discover',     component: lazy(() => import('@/apps/discover/Entry')) },
  listings:     { key: 'listings',     title: 'Listings',     component: lazy(() => import('@/apps/listings/Entry')) },
  events:       { key: 'events',       title: 'Events',       component: lazy(() => import('@/apps/events/Entry')) },
  earnings:     { key: 'earnings',     title: 'Earnings',     component: lazy(() => import('@/apps/earnings/Entry')) },
  incentives:   { key: 'incentives',   title: 'Incentives',   component: lazy(() => import('@/apps/incentives/Entry')) },
  'farm-ops':   { key: 'farm-ops',     title: 'Farm Ops',     component: lazy(() => import('@/apps/farm-ops/Entry')) },
  activity:     { key: 'activity',     title: 'AI Activity',  component: lazy(() => import('@/apps/activity/Entry')) },
  analytics:    { key: 'analytics',    title: 'Analytics',    component: lazy(() => import('@/apps/analytics/Entry')) },
  favorites:    { key: 'favorites',    title: 'Favorites',    component: lazy(() => import('@/apps/favorites/Entry')) },
  business:     { key: 'business',     title: 'Business',     component: lazy(() => import('@/apps/business/Entry')) },
  producer:     { key: 'producer',     title: 'Producer',     component: lazy(() => import('@/apps/producer/Entry')) },

  // 🟢 Brand canon: Yallbrary
  yallbrary:    { key: 'yallbrary',    title: 'Yallbrary',    component: lazy(() => import('@/apps/yallbrary/Entry')) },
};

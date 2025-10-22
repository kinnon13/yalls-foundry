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
  cart:         { key: 'cart',         title: 'Cart',             role: 'user',  component: lazy(() => import('@/apps/cart/Entry')) },
  orders:       { key: 'orders',       title: 'Orders',           role: 'user',  component: lazy(() => import('@/apps/orders/Entry')) },
  notifications:{ key: 'notifications',title: 'Notifications',    role: 'user',  component: lazy(() => import('@/apps/notifications/Entry')) },

  // 🟢 Profiles & graph
  profile:      { key: 'profile',      title: 'Profile',          role: 'user',  component: lazy(() => import('@/apps/profile/Entry')) },
  entities:     { key: 'entities',     title: 'Entities',         role: 'user',  component: lazy(() => import('@/apps/entities/Entry')) },

  // 🟢 Growth & settings
  mlm:          { key: 'mlm',          title: 'Affiliate Network',role: 'user',  component: lazy(() => import('@/apps/mlm/Entry')) },
  settings:     { key: 'settings',     title: 'Settings',         role: 'user',  component: lazy(() => import('@/apps/settings/Entry')) },
  overview:     { key: 'overview',     title: 'Owner HQ',         role: 'user',  component: lazy(() => import('@/apps/overview/Entry')) },

  // 🟢 AI Assistants
  andy:         { key: 'andy',         title: 'Super Andy',       role: 'user',  component: lazy(() => import('@/pages/SuperAndy/Index')) },
  rocker:       { key: 'rocker',       title: 'Rocker',           role: 'user',  component: lazy(() => import('@/apps/rocker/Entry')) },
  'admin-rocker': { key: 'admin-rocker', title: 'Admin Rocker',   role: 'admin', component: lazy(() => import('@/apps/admin-rocker/Entry')) },

  // 🟡 Rest exist (scaffolded) - will wire later
  crm:          { key: 'crm',          title: 'CRM',              role: 'admin', component: lazy(() => import('@/apps/crm/Entry')) },
  marketplace:  { key: 'marketplace',  title: 'Marketplace',      role: 'user',  component: lazy(() => import('@/apps/marketplace/Entry')) },
  messages:     { key: 'messages',     title: 'Messages',         role: 'user',  component: lazy(() => import('@/apps/messages/Entry')) },
  calendar:     { key: 'calendar',     title: 'Calendar',         role: 'user',  component: lazy(() => import('@/apps/calendar/Entry')) },
  discover:     { key: 'discover',     title: 'Discover',         role: 'user',  component: lazy(() => import('@/apps/discover/Entry')) },
  listings:     { key: 'listings',     title: 'Listings',         role: 'user',  component: lazy(() => import('@/apps/listings/Entry')) },
  events:       { key: 'events',       title: 'Events',           role: 'user',  component: lazy(() => import('@/apps/events/Entry')) },
  earnings:     { key: 'earnings',     title: 'Earnings',         role: 'admin', component: lazy(() => import('@/apps/earnings/Entry')) },
  incentives:   { key: 'incentives',   title: 'Incentives',       role: 'admin', component: lazy(() => import('@/apps/incentives/Entry')) },
  'farm-ops':   { key: 'farm-ops',     title: 'Farm Ops',         role: 'admin', component: lazy(() => import('@/apps/farm-ops/Entry')) },
  activity:     { key: 'activity',     title: 'AI Activity',      role: 'admin', component: lazy(() => import('@/apps/activity/Entry')) },
  analytics:    { key: 'analytics',    title: 'Analytics',        role: 'admin', component: lazy(() => import('@/apps/analytics/Entry')) },
  favorites:    { key: 'favorites',    title: 'Favorites',        role: 'user',  component: lazy(() => import('@/apps/favorites/Entry')) },
  business:     { key: 'business',     title: 'Business',         role: 'admin', component: lazy(() => import('@/apps/business/Entry')) },
  producer:     { key: 'producer',     title: 'Producer',         role: 'admin', component: lazy(() => import('@/apps/producer/Entry')) },

  // 🟢 Brand canon: Yallbrary
  yallbrary:    { key: 'yallbrary',    title: 'Yallbrary',        role: 'user',  component: lazy(() => import('@/apps/yallbrary/Entry')) },
};

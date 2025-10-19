/**
 * Overlay Registry
 * Maps overlay keys to lazy-loaded components
 */

import { lazy } from 'react';
import type { OverlayConfig } from './types';

export const OVERLAY_REGISTRY: Record<string, OverlayConfig> = {
  messages: {
    key: 'messages',
    title: 'Messages',
    component: lazy(() => import('@/routes/messages')),
    requiresAuth: true,
  },
  marketplace: {
    key: 'marketplace',
    title: 'Marketplace',
    component: lazy(() => import('@/routes/marketplace/index')),
  },
  'app-store': {
    key: 'app-store',
    title: "Y'alls Library",
    component: lazy(() => import('@/routes/app-store/index')),
  },
  crm: {
    key: 'crm',
    title: 'CRM',
    component: lazy(() => import('@/routes/crm/index')),
    requiresAuth: true,
  },
  profile: {
    key: 'profile',
    title: 'Profile',
    component: lazy(() => import('@/routes/profile/[id]')),
  },
  entities: {
    key: 'entities',
    title: 'Entities',
    component: lazy(() => import('@/routes/entities/index')),
  },
  events: {
    key: 'events',
    title: 'Events',
    component: lazy(() => import('@/routes/events/index')),
  },
  listings: {
    key: 'listings',
    title: 'Listings',
    component: lazy(() => import('@/routes/listings/new')),
    requiresAuth: true,
  },
  business: {
    key: 'business',
    title: 'Business',
    component: lazy(() => import('@/routes/dashboard/business')),
    requiresAuth: true,
  },
  producer: {
    key: 'producer',
    title: 'Producer',
    component: lazy(() => import('@/routes/dashboard/business')),
    requiresAuth: true,
  },
  incentives: {
    key: 'incentives',
    title: 'Incentives',
    component: lazy(() => import('@/routes/incentives/dashboard')),
    requiresAuth: true,
  },
  calendar: {
    key: 'calendar',
    title: 'Calendar',
    component: lazy(() => import('@/routes/farm/calendar')),
    requiresAuth: true,
  },
  activity: {
    key: 'activity',
    title: 'AI Activity',
    component: lazy(() => import('@/routes/ai/activity')),
    requiresAuth: true,
  },
  analytics: {
    key: 'analytics',
    title: 'Analytics',
    component: lazy(() => import('@/routes/dashboard/overview')),
    requiresAuth: true,
  },
  favorites: {
    key: 'favorites',
    title: 'Favorites',
    component: lazy(() => import('@/apps/_placeholder/PlaceholderEntry')),
    requiresAuth: true,
  },
  'yall-library': {
    key: 'yall-library',
    title: "Y'alls Library",
    component: lazy(() => import('@/routes/app-store/index')),
  },
  cart: {
    key: 'cart',
    title: 'Cart',
    component: lazy(() => import('@/routes/cart/index')),
    requiresAuth: true,
  },
  orders: {
    key: 'orders',
    title: 'Orders',
    component: lazy(() => import('@/routes/orders/index')),
    requiresAuth: true,
  },
  notifications: {
    key: 'notifications',
    title: 'Notifications',
    component: lazy(() => import('@/routes/notifications')),
    requiresAuth: true,
  },
  settings: {
    key: 'settings',
    title: 'Settings',
    component: lazy(() => import('@/routes/dashboard/settings')),
    requiresAuth: true,
  },
};

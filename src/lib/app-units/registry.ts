/**
 * App Units Registry
 * 
 * Single source of truth for all app units (standalone + embeddable)
 */

import { lazy } from 'react';
import { 
  MessageCircle, Store, Calendar, Activity, Map, FileText, 
  Trophy, Briefcase, Users, DollarSign, TrendingUp, 
  Settings, Heart, Search, Target
} from 'lucide-react';
import type { AppUnit, AppUnitRegistry } from './types';

// Placeholder component for all apps (to be replaced with actual implementations)
const PlaceholderEntry = lazy(() => import('@/apps/_placeholder/PlaceholderEntry'));
const PlaceholderPanel = lazy(() => import('@/apps/_placeholder/PlaceholderPanel'));

/**
 * App Units Registry — 15 initial apps
 */
export const APP_UNITS: AppUnitRegistry = {
  // ===== CONSUMER APPS (available to all) =====
  
  crm: {
    id: 'crm',
    name: 'CRM',
    shortName: 'CRM',
    description: 'Contact management across all your accounts',
    icon: Users,
    category: 'productivity',
    supportedContexts: ['user', 'business', 'farm', 'stallion', 'producer'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'edit', 'delete', 'export', 'import'],
    tags: ['contacts', 'phonebook', 'address-book'],
    searchKeywords: ['crm', 'contacts', 'phone', 'address', 'people'],
    featured: true,
    version: '1.0.0',
  },
  
  marketplace: {
    id: 'marketplace',
    name: 'Marketplace',
    shortName: 'Shop',
    description: 'Browse and shop listings',
    icon: Store,
    category: 'commerce',
    supportedContexts: ['user', 'business'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'edit', 'delete'],
    tags: ['shop', 'buy', 'sell', 'listings'],
    searchKeywords: ['marketplace', 'shop', 'store', 'buy', 'sell'],
    featured: true,
    version: '1.0.0',
  },
  
  discover: {
    id: 'discover',
    name: 'Discover',
    description: 'Explore trending content and people',
    icon: Search,
    category: 'social',
    supportedContexts: ['user'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view'],
    tags: ['explore', 'trending', 'search'],
    searchKeywords: ['discover', 'explore', 'trending', 'for you'],
    featured: true,
    version: '1.0.0',
  },
  
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'View and manage your schedule',
    icon: Calendar,
    category: 'productivity',
    supportedContexts: ['user', 'business', 'farm'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'edit', 'delete', 'export'],
    tags: ['schedule', 'events', 'appointments'],
    searchKeywords: ['calendar', 'schedule', 'events', 'appointments'],
    version: '1.0.0',
  },
  
  activity: {
    id: 'activity',
    name: 'Activity',
    description: 'Recent actions and notifications',
    icon: Activity,
    category: 'productivity',
    supportedContexts: ['user', 'business', 'farm', 'stallion', 'producer'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view'],
    tags: ['notifications', 'updates', 'history'],
    searchKeywords: ['activity', 'notifications', 'updates', 'history'],
    version: '1.0.0',
  },
  
  messages: {
    id: 'messages',
    name: 'Messages',
    description: 'Direct messaging and conversations',
    icon: MessageCircle,
    category: 'social',
    supportedContexts: ['user', 'business'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'delete'],
    tags: ['chat', 'dm', 'conversations'],
    searchKeywords: ['messages', 'chat', 'dm', 'conversations'],
    featured: true,
    version: '1.0.0',
  },
  
  map: {
    id: 'map',
    name: 'Map',
    description: 'Discover nearby businesses and events',
    icon: Map,
    category: 'tools',
    supportedContexts: ['user'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view'],
    tags: ['location', 'nearby', 'places'],
    searchKeywords: ['map', 'location', 'nearby', 'places'],
    comingSoon: true,
    version: '0.1.0',
  },
  
  goals: {
    id: 'goals',
    name: 'Goals',
    description: 'Track your progress and achievements',
    icon: Target,
    category: 'productivity',
    supportedContexts: ['user', 'business', 'farm'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'edit', 'delete'],
    tags: ['goals', 'progress', 'tracking'],
    searchKeywords: ['goals', 'progress', 'achievements', 'tracking'],
    comingSoon: true,
    version: '0.1.0',
  },
  
  // ===== MANAGEMENT APPS (require ownership) =====
  
  listings: {
    id: 'listings',
    name: 'Listings Manager',
    shortName: 'Listings',
    description: 'Manage your marketplace listings',
    icon: FileText,
    category: 'commerce',
    supportedContexts: ['business'],
    requiresOwnership: true,
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'edit', 'delete', 'export'],
    tags: ['sell', 'products', 'inventory'],
    searchKeywords: ['listings', 'products', 'inventory', 'sell'],
    version: '1.0.0',
  },
  
  events: {
    id: 'events',
    name: 'Events Manager',
    shortName: 'Events',
    description: 'Create and manage events',
    icon: Calendar,
    category: 'events',
    supportedContexts: ['business', 'producer'],
    requiresOwnership: true,
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'edit', 'delete', 'export'],
    tags: ['events', 'competitions', 'shows'],
    searchKeywords: ['events', 'competitions', 'shows', 'manage'],
    version: '1.0.0',
  },
  
  earnings: {
    id: 'earnings',
    name: 'Earnings',
    description: 'Track revenue and payouts',
    icon: DollarSign,
    category: 'management',
    supportedContexts: ['business', 'producer'],
    requiresOwnership: true,
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'export'],
    tags: ['money', 'revenue', 'payouts'],
    searchKeywords: ['earnings', 'revenue', 'payouts', 'money'],
    version: '1.0.0',
  },
  
  incentives: {
    id: 'incentives',
    name: 'Incentives',
    description: 'Manage producer incentive programs',
    icon: Trophy,
    category: 'management',
    supportedContexts: ['producer'],
    requiresOwnership: true,
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'edit', 'delete'],
    tags: ['incentives', 'programs', 'bonuses'],
    searchKeywords: ['incentives', 'programs', 'bonuses', 'producer'],
    version: '1.0.0',
  },
  
  farmOps: {
    id: 'farmOps',
    name: 'Farm Operations',
    shortName: 'Farm Ops',
    description: 'Barn dashboard and horse management',
    icon: Briefcase,
    category: 'management',
    supportedContexts: ['farm'],
    requiresOwnership: true,
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'create', 'edit', 'delete', 'export', 'import'],
    tags: ['barn', 'horses', 'boarders', 'care'],
    searchKeywords: ['farm', 'barn', 'horses', 'operations', 'management'],
    version: '1.0.0',
  },
  
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Insights and performance metrics',
    icon: TrendingUp,
    category: 'management',
    supportedContexts: ['business', 'producer', 'farm'],
    requiresOwnership: true,
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'export'],
    tags: ['insights', 'metrics', 'data'],
    searchKeywords: ['analytics', 'insights', 'metrics', 'data', 'stats'],
    comingSoon: true,
    version: '0.1.0',
  },
  
  favorites: {
    id: 'favorites',
    name: 'Favorites',
    description: 'Your saved people and places',
    icon: Heart,
    category: 'social',
    supportedContexts: ['user'],
    entryComponent: PlaceholderEntry,
    panelComponent: PlaceholderPanel,
    capabilities: ['view', 'delete'],
    tags: ['saved', 'bookmarks', 'pins'],
    searchKeywords: ['favorites', 'saved', 'bookmarks', 'pins'],
    version: '1.0.0',
  },
};

/**
 * Get app unit by ID
 */
export function getAppUnit(id: string): AppUnit | undefined {
  return APP_UNITS[id];
}

/**
 * Get all app units
 */
export function getAllAppUnits(): AppUnit[] {
  return Object.values(APP_UNITS);
}

/**
 * Get app units for a specific context
 */
export function getAppUnitsForContext(contextType: string): AppUnit[] {
  return Object.values(APP_UNITS).filter(app => 
    app.supportedContexts.includes(contextType as any)
  );
}

/**
 * Get consumer apps (no ownership required)
 */
export function getConsumerApps(): AppUnit[] {
  return Object.values(APP_UNITS).filter(app => !app.requiresOwnership);
}

/**
 * Get management apps (ownership required)
 */
export function getManagementApps(): AppUnit[] {
  return Object.values(APP_UNITS).filter(app => app.requiresOwnership);
}

/**
 * Get featured apps
 */
export function getFeaturedApps(): AppUnit[] {
  return Object.values(APP_UNITS).filter(app => app.featured);
}

/**
 * Search app units
 */
export function searchAppUnits(query: string): AppUnit[] {
  const q = query.toLowerCase();
  return Object.values(APP_UNITS).filter(app => 
    app.name.toLowerCase().includes(q) ||
    app.description?.toLowerCase().includes(q) ||
    app.searchKeywords?.some(kw => kw.includes(q)) ||
    app.tags?.some(tag => tag.includes(q))
  );
}

/**
 * Get pre-pinned tools for producer businesses
 */
export function getProducerPrePins(): string[] {
  return ['crm', 'listings', 'events', 'earnings', 'incentives'];
}

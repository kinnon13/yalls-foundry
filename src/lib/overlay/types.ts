/**
 * Overlay System Types
 * Primary navigation model: ?app=key opens apps in-place
 */

export type OverlayKey =
  | 'messages'
  | 'marketplace'
  | 'app-store'
  | 'crm'
  | 'profile'
  | 'entities'
  | 'events'
  | 'listings'
  | 'business'
  | 'producer'
  | 'incentives'
  | 'calendar'
  | 'activity'
  | 'analytics'
  | 'favorites'
  | 'yall-library'
  | 'cart'
  | 'orders'
  | 'notifications'
  | 'settings';

export interface OverlayConfig {
  key: OverlayKey;
  title: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  requiresAuth?: boolean;
  allowedContexts?: Array<'user' | 'business' | 'farm' | 'stallion' | 'producer'>;
}

export interface OverlayState {
  isOpen: boolean;
  activeKey: OverlayKey | null;
  params: Record<string, string>;
}

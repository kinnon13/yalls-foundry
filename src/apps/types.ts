/**
 * App Types
 * Core type definitions for the app ecosystem
 */

export type AppId =
  | 'yallbrary' | 'messages' | 'marketplace' | 'crm' | 'calendar' | 'discover'
  | 'listings' | 'events' | 'earnings' | 'incentives' | 'farm-ops' | 'activity'
  | 'analytics' | 'favorites' | 'cart' | 'orders' | 'notifications' | 'profile'
  | 'entities' | 'mlm' | 'business' | 'producer' | 'settings' | 'overview';

export interface AppContract {
  id: AppId;
  title: string;
  routes?: string[];         // deep links this app owns (optional)
  role?: 'user' | 'admin' | 'super';
  testIds: { entryRoot: string; panelRoot: string };
}

export interface AppUnitProps {
  contextType: 'overlay' | 'panel';
  contextId?: string; // optional record id, entity id, etc.
}

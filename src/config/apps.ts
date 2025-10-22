/**
 * Central App Registry
 * Single source of truth for all app definitions
 */

import { LucideIcon } from 'lucide-react';
import { 
  MessageSquare, ShoppingBag, Calendar, ShoppingCart, Package,
  Store, DollarSign, Bell, Heart, Sparkles, Users, BarChart3,
  Video, User, Settings
} from 'lucide-react';
import type { OverlayKey } from '@/lib/overlay/types';

export interface AppConfig {
  id: OverlayKey;
  label: string;
  icon: LucideIcon;
  iconName: string; // For storage/serialization
  description: string;
  category: string;
  color: string;
  gradient: string;
  installed?: boolean;
  updateAvailable?: boolean;
}

// Icon name to component mapping
export const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare,
  ShoppingBag,
  Calendar,
  ShoppingCart,
  Package,
  Store,
  DollarSign,
  Bell,
  Heart,
  Sparkles,
  Users,
  BarChart3,
  Video,
  User,
  Settings,
};

// All available apps - single source of truth
export const ALL_APPS: AppConfig[] = [
  // Commerce
  { 
    id: 'marketplace', 
    label: 'Marketplace', 
    icon: ShoppingBag,
    iconName: 'ShoppingBag',
    description: 'Browse & buy listings', 
    category: 'Commerce', 
    color: 'text-white', 
    gradient: 'from-green-500 via-emerald-500 to-teal-400', 
    installed: true 
  },
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: ShoppingCart,
    iconName: 'ShoppingCart',
    description: 'Manage order lifecycle', 
    category: 'Commerce', 
    color: 'text-white', 
    gradient: 'from-blue-500 via-blue-600 to-cyan-500', 
    installed: true 
  },
  { 
    id: 'cart', 
    label: 'Cart', 
    icon: ShoppingCart,
    iconName: 'ShoppingCart',
    description: 'Shopping cart & checkout', 
    category: 'Commerce', 
    color: 'text-white', 
    gradient: 'from-cyan-400 via-teal-400 to-emerald-300', 
    installed: true 
  },
  { 
    id: 'listings', 
    label: 'Listings', 
    icon: Store,
    iconName: 'Store',
    description: 'Create marketplace listings', 
    category: 'Commerce', 
    color: 'text-white', 
    gradient: 'from-orange-400 via-orange-500 to-amber-400', 
    installed: true 
  },
  
  // Money
  { 
    id: 'earnings', 
    label: 'Earnings', 
    icon: DollarSign,
    iconName: 'DollarSign',
    description: 'View sales & revenue', 
    category: 'Money', 
    color: 'text-white', 
    gradient: 'from-emerald-400 via-green-500 to-teal-400', 
    installed: true 
  },
  
  // Ops
  { 
    id: 'messages', 
    label: 'Messages', 
    icon: MessageSquare,
    iconName: 'MessageSquare',
    description: 'Unified inbox & CRM', 
    category: 'Ops', 
    color: 'text-white', 
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-500', 
    installed: true 
  },
  { 
    id: 'notifications', 
    label: 'Notifications', 
    icon: Bell,
    iconName: 'Bell',
    description: 'Alerts & updates', 
    category: 'Ops', 
    color: 'text-white', 
    gradient: 'from-amber-400 via-orange-400 to-red-400', 
    installed: true 
  },
  { 
    id: 'calendar', 
    label: 'Calendar', 
    icon: Calendar,
    iconName: 'Calendar',
    description: 'Events & bookings', 
    category: 'Ops', 
    color: 'text-white', 
    gradient: 'from-red-500 via-orange-500 to-amber-400', 
    installed: true 
  },
  { 
    id: 'favorites', 
    label: 'Favorites', 
    icon: Heart,
    iconName: 'Heart',
    description: 'Saved items & likes', 
    category: 'Ops', 
    color: 'text-white', 
    gradient: 'from-pink-500 via-rose-500 to-red-400', 
    installed: true 
  },
  
  // Growth
  { 
    id: 'mlm', 
    label: 'Affiliate', 
    icon: Users,
    iconName: 'Users',
    description: 'Grow your network', 
    category: 'Growth', 
    color: 'text-white', 
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500', 
    installed: true 
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: BarChart3,
    iconName: 'BarChart3',
    description: 'Insights & metrics', 
    category: 'Growth', 
    color: 'text-white', 
    gradient: 'from-slate-500 via-gray-600 to-zinc-500', 
    installed: true 
  },
  
  // Creator
  { 
    id: 'yallbrary', 
    label: 'Creator Studio', 
    icon: Video,
    iconName: 'Video',
    description: 'Video editing & publishing', 
    category: 'Creator', 
    color: 'text-white',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-400' 
  },
  
  // System
  { 
    id: 'profile', 
    label: 'My Profile', 
    icon: User,
    iconName: 'User',
    description: 'View and edit your profile', 
    category: 'System', 
    color: 'text-white', 
    gradient: 'from-blue-500 via-indigo-500 to-purple-500', 
    installed: true 
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings,
    iconName: 'Settings',
    description: 'App preferences', 
    category: 'System', 
    color: 'text-white', 
    gradient: 'from-gray-600 via-gray-700 to-slate-700', 
    installed: true 
  },
];

// Helper to get app by ID
export function getAppById(id: string): AppConfig | undefined {
  return ALL_APPS.find(app => app.id === id);
}

// Helper to get multiple apps by IDs
export function getAppsByIds(ids: string[]): AppConfig[] {
  return ids.map(id => getAppById(id)).filter((app): app is AppConfig => app !== undefined);
}

// Default pinned app IDs
export const DEFAULT_PINNED_APP_IDS: OverlayKey[] = [
  'messages',
  'marketplace', 
  'calendar',
  'orders'
];

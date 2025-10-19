/**
 * App Units Type Definitions
 * 
 * Defines the structure for dual-mode (overlay + panel) app units
 */

import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Context types that an app unit can run within
 */
export type AppContext = 'user' | 'business' | 'farm' | 'stallion' | 'producer';

/**
 * Props passed to both overlay and panel components
 */
export interface AppUnitProps {
  contextType: AppContext;
  contextId: string;
  mode: 'overlay' | 'panel';
  onClose?: () => void;
}

/**
 * Capability flags for what an app unit can do
 */
export type AppCapability = 
  | 'view' | 'create' | 'edit' | 'delete' 
  | 'export' | 'import' | 'share' | 'print';

/**
 * App Unit Definition
 */
export interface AppUnit {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  icon: LucideIcon;
  category: 'productivity' | 'commerce' | 'events' | 'management' | 'social' | 'tools';
  
  // Context support
  supportedContexts: AppContext[];
  requiresOwnership?: boolean;  // Must be owner/member of context
  
  // Components
  entryComponent: ComponentType<AppUnitProps>;  // Full overlay version
  panelComponent: ComponentType<AppUnitProps>;  // Miniature panel version
  
  // Metadata
  capabilities?: AppCapability[];
  tags?: string[];
  searchKeywords?: string[];
  featured?: boolean;
  comingSoon?: boolean;
  
  // Versioning
  version: string;
  lastUpdated?: string;
}

/**
 * Registry type
 */
export type AppUnitRegistry = Record<string, AppUnit>;

/**
 * Active app context (tracks current running app)
 */
export interface ActiveAppContext {
  appId: string;
  contextType: AppContext;
  contextId: string;
  mode: 'overlay' | 'panel';
}

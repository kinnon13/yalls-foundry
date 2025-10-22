/**
 * Overlay Types
 * Type-safe overlay configuration
 */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { AppId } from '@/apps/types';

// Export OverlayKey as alias of AppId for backwards compatibility
export type OverlayKey = AppId;

export interface OverlayConfig {
  key: AppId;
  title: string;
  role: 'anonymous' | 'user' | 'admin' | 'super';
  component: LazyExoticComponent<ComponentType<any>>;
}

export interface OverlayState {
  isOpen: boolean;
  activeKey: AppId | null;
  params: Record<string, string>;
}

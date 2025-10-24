/**
 * Role: Yallbrary store service - manages app registry, pinning, and ?app= loading
 * Path: yalls-inc/yallbrary/src/services/store.service.ts
 * Imports: @/integrations/supabase/client
 */

import { supabase } from '@/integrations/supabase/client';

export interface AppMetadata {
  id: string;
  title: string;
  description: string;
  icon_url?: string;
  category: string;
  is_public: boolean;
}

export interface PinnedApp {
  user_id: string;
  app_id: string;
  position: number;
  customization?: Record<string, unknown>;
}

/**
 * Fetch all available apps from registry
 */
export async function fetchAvailableApps(): Promise<AppMetadata[]> {
  const { data, error } = await supabase
    .from('yallbrary_apps')
    .select('*')
    .eq('is_public', true)
    .order('title');

  if (error) throw error;
  return data || [];
}

/**
 * Fetch user's pinned apps
 */
export async function fetchPinnedApps(userId: string): Promise<PinnedApp[]> {
  const { data, error } = await supabase
    .from('yallbrary_pins')
    .select('*')
    .eq('user_id', userId)
    .order('position');

  if (error) throw error;
  return data || [];
}

/**
 * Pin app to user's rocker dashboard
 */
export async function pinApp(userId: string, appId: string, position: number): Promise<void> {
  const { error } = await supabase
    .from('yallbrary_pins')
    .insert({ user_id: userId, app_id: appId, position });

  if (error) throw error;
}

/**
 * Unpin app from dashboard
 */
export async function unpinApp(userId: string, appId: string): Promise<void> {
  const { error } = await supabase
    .from('yallbrary_pins')
    .delete()
    .eq('user_id', userId)
    .eq('app_id', appId);

  if (error) throw error;
}

/**
 * Reorder pinned apps
 */
export async function reorderPins(userId: string, appIds: string[]): Promise<void> {
  const updates = appIds.map((appId, index) => ({
    user_id: userId,
    app_id: appId,
    position: index
  }));

  const { error } = await supabase
    .from('yallbrary_pins')
    .upsert(updates);

  if (error) throw error;
}

/**
 * Load app via ?app= query param (stub for dynamic federation)
 * TODO: Implement module federation loader for remote apps
 */
export async function loadApp(appId: string): Promise<{ component: string; config: Record<string, unknown> }> {
  const { data, error } = await supabase
    .from('yallbrary_apps')
    .select('*')
    .eq('id', appId)
    .single();

  if (error) throw error;
  
  // Stub: Return component path for dynamic import
  return {
    component: `@/apps/${appId}/index`,
    config: data.customization || {}
  };
}

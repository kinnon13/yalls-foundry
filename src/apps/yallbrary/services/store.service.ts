/**
 * Role: Yallbrary store service - manages app registry and pinning
 * Path: src/apps/yallbrary/services/store.service.ts
 */

export interface PinnedApp {
  user_id: string;
  app_id: string;
  position: number;
}

export async function fetchPinnedApps(userId: string): Promise<PinnedApp[]> {
  // Stub: Return empty array until backend is connected
  console.log('fetchPinnedApps stub:', userId);
  return [];
}

export async function unpinApp(userId: string, appId: string): Promise<void> {
  console.log('unpinApp stub:', { userId, appId });
}

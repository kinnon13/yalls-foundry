/**
 * App Pins Hook - For draggable grid positioning
 * Stub version until tables are created
 */

export interface AppFolder {
  id: string;
  name: string;
  title?: string;
  apps?: Array<{
    id: string;
    app_id: string;
  }>;
  appIds?: string[];
}

interface AppPin {
  id: string;
  user_id: string;
  app_id: string;
  grid_x: number;
  grid_y: number;
}

export function useAppPins(userId: string | null) {
  return {
    pins: [] as AppPin[],
    folders: [] as AppFolder[],
    updatePosition: {
      mutate: (params: { pinId: string; x: number; y: number }) => {
        console.log('updatePosition stub:', params);
      },
    },
    pinApp: {
      mutate: (params: { appId: string; x: number; y: number }) => {
        console.log('pinApp stub:', params);
      },
    },
    createFolder: {
      mutate: (params: { name: string; appIds: string[] }) => {
        console.log('createFolder stub:', params);
      },
    },
  };
}

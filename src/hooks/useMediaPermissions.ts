import { useEffect, useState, useCallback } from 'react';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

interface MediaPermissionStatus {
  camera: PermissionState;
  microphone: PermissionState;
  loading: boolean;
  refresh: () => Promise<void>;
}

const LS_KEY = 'yalls.mediaPermissions.granted';

export function useMediaPermissions(): MediaPermissionStatus {
  const [camera, setCamera] = useState<PermissionState>('unsupported');
  const [microphone, setMicrophone] = useState<PermissionState>('unsupported');
  const [loading, setLoading] = useState(true);

  const queryPermission = async (name: PermissionName): Promise<PermissionState> => {
    try {
      if (!('permissions' in navigator)) return 'unsupported';
      // @ts-ignore: PermissionName may not include 'camera'/'microphone' in lib.dom
      const status: PermissionStatus = await (navigator as any).permissions.query({ name });
      return status.state as PermissionState;
    } catch {
      return 'unsupported';
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    const [cam, mic] = await Promise.all([
      queryPermission('camera' as PermissionName),
      queryPermission('microphone' as PermissionName),
    ]);
    setCamera(cam);
    setMicrophone(mic);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    // If both granted, stamp locally to avoid re-prompting UX
    if (camera === 'granted' && microphone === 'granted') {
      try { localStorage.setItem(LS_KEY, 'true'); } catch {}
    }
  }, [camera, microphone]);

  return { camera, microphone, loading, refresh };
}

export function hasMediaGrantStamp() {
  try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
}

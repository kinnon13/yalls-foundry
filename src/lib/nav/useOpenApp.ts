import { useOverlay } from '@/lib/overlay/OverlayProvider';
import type { OverlayKey } from '@/lib/overlay/types';

export function useOpenApp() {
  const { open } = useOverlay();
  return (key: OverlayKey, params?: Record<string, string>) => open(key, params);
}

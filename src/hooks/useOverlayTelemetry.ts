/**
 * Overlay Telemetry Hook
 * Tracks overlay open/close events for Rocker AI
 */

import { useEffect } from 'react';
import { useOverlay } from '@/lib/overlay/OverlayProvider';
import { rocker } from '@/lib/rocker/event-bus';

export function useOverlayTelemetry() {
  const { state } = useOverlay();

  useEffect(() => {
    if (state.isOpen && state.activeKey) {
      rocker.emit('overlay_view', {
        metadata: {
          key: state.activeKey,
          params: state.params,
        },
      });
    }
  }, [state.activeKey, state.isOpen]);
}

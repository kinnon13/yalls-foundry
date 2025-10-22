/**
 * Panel Host - Mini dock widgets
 * Renders based on ?panel= query parameter with role-based gating
 */

import { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OVERLAY_REGISTRY } from '@/lib/overlay/registry';
import { getCurrentRole, rank } from '@/security/role';
import type { AppId } from '@/apps/types';

export default function PanelHost() {
  const role = getCurrentRole();
  const [sp, setSp] = useSearchParams();
  const key = sp.get('panel') as AppId | null;
  
  if (!key) return null;

  const cfg = OVERLAY_REGISTRY[key];
  if (!cfg) return null;
  
  const allowed = rank(role) >= rank(cfg.role);

  const close = () => {
    const next = new URLSearchParams(sp);
    next.delete('panel');
    setSp(next, { replace: true });
  };

  return (
    <div data-testid="panel-root" className="fixed right-4 bottom-4 z-[1001]">
      <div className="bg-background border shadow-lg rounded-xl w-[min(380px,92vw)] max-h-[60vh] overflow-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 data-testid="panel-title" className="font-medium text-sm">
            Dock: {cfg.title}
          </h3>
          <button 
            aria-label="Close panel" 
            onClick={close} 
            className="px-2 py-1 rounded hover:bg-muted text-sm"
          >
            ✕
          </button>
        </div>

        {!allowed ? (
          <div className="p-3 text-sm text-muted-foreground" data-testid="panel-403">
            Access restricted: requires {cfg.role}. You are {role}.
          </div>
        ) : (
          <Suspense fallback={<div className="p-3 text-sm">Loading…</div>}>
            <cfg.component contextType="panel" />
          </Suspense>
        )}
      </div>
    </div>
  );
}

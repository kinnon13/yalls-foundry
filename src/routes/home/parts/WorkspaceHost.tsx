import { lazy, Suspense, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

// REGISTER ANYTHING YOU WANT TO OPEN IN-PLACE
const REGISTRY: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  messages: lazy(() => import('@/routes/messages/index')),
  profile: lazy(() => import('@/routes/profile')),
  marketplace: lazy(() => import('@/routes/marketplace/index')),
  social: lazy(() => import('@/routes/social')),
  discover: lazy(() => import('@/routes/discover')),
};

export function openInWorkspace(sp: URLSearchParams, setSp: (p: any) => void, key: string, extra?: Record<string, string>) {
  const next = new URLSearchParams(sp);
  next.set('app', key);
  if (extra) Object.entries(extra).forEach(([k, v]) => next.set(k, v));
  setSp(next);
}

export default function WorkspaceHost() {
  const [sp, setSp] = useSearchParams();
  const key = sp.get('app') || '';
  const App = useMemo(() => (key && REGISTRY[key]) ? REGISTRY[key] : null, [key]);

  // ESC to close
  useMemo(() => {
    if (!key) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sp.delete('app');
        setSp(sp);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, sp, setSp]);

  if (!App) return null;

  return (
    <div
      className="
        pointer-events-auto
        fixed inset-x-0 md:inset-x-auto md:left-0
        top-[64px] bottom-[56px]
        z-30
        md:w-[min(920px,66vw)]
        mx-auto md:mx-0
      "
      role="dialog"
      aria-modal="true"
    >
      {/* Card chrome */}
      <div className="relative h-full rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        <button
          onClick={() => { 
            sp.delete('app'); 
            Object.keys(Object.fromEntries(sp)).forEach(k => {
              if (k !== 'feed') sp.delete(k);
            });
            setSp(sp); 
          }}
          className="absolute top-2 right-2 z-10 size-9 rounded-lg bg-white/8 hover:bg-white/12 border border-white/10 grid place-items-center transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App content scrolls independently */}
        <div className="h-full overflow-y-auto overscroll-contain">
          <Suspense fallback={<div className="p-8 text-sm opacity-70">Loading…</div>}>
            <App />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

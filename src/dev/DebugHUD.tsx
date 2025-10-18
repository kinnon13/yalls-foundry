import { useEffect, useState } from 'react';

type Mode = '' | 'boxes' | 'grid';

export default function DebugHUD() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('debug.mode') as Mode) || '');

  // apply + persist
  useEffect(() => {
    document.documentElement.setAttribute('data-debug', mode);
    localStorage.setItem('debug.mode', mode);
  }, [mode]);

  // URL param: ?debug=boxes|grid
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('debug') as Mode | null;
    if (q) setMode(q);
  }, []);

  // ⌘` / Ctrl` to cycle Off → Boxes → Grid
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        setMode(m => (m === '' ? 'boxes' : m === 'boxes' ? 'grid' : ''));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (import.meta.env.PROD) return null; // dev-only

  const btn = (id: Mode) =>
    `h-9 w-9 rounded-lg border text-xs grid place-items-center
     ${mode===id ? 'bg-primary text-primary-foreground' : 'bg-white/10'}`;

  return (
    <div className="fixed right-3 bottom-16 z-[9999] flex gap-2">
      <button onClick={() => setMode(mode==='boxes' ? '' : 'boxes')} className={btn('boxes')} title="Boxes">[]</button>
      <button onClick={() => setMode(mode==='grid' ? '' : 'grid')} className={btn('grid')} title="Grid">#</button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Bug, Grid2X2, Box, Braces } from 'lucide-react';

type Mode = '' | 'boxes' | 'grid' | 'vars';

function setMode(next: Mode) {
  const root = document.documentElement;
  if (next) root.setAttribute('data-debug', next);
  else root.removeAttribute('data-debug');
  localStorage.setItem('debug.mode', next);
}

export default function DebugToggles() {
  const [mode, _setMode] = useState<Mode>(() => (localStorage.getItem('debug.mode') as Mode) || '');

  // load from query param once
  useEffect(() => {
    const p = new URLSearchParams(location.search).get('debug') as Mode | null;
    if (p && p !== mode) { _setMode(p); setMode(p); }
    // Ctrl/Cmd + ` to cycle modes
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        const cycle: Mode[] = ['', 'boxes', 'grid', 'vars'];
        const idx = cycle.indexOf(mode);
        const next = cycle[(idx + 1) % cycle.length];
        _setMode(next); setMode(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  useEffect(() => { setMode(mode); }, [mode]);

  if (!import.meta.env.DEV) return null;

  return (
    <>
      {/* floating button group */}
      <div className="fixed right-2 bottom-[calc(56px+8px)] z-50 flex gap-2">
        <Btn title="Toggle Boxes" active={mode==='boxes'} onClick={() => _setMode(mode==='boxes' ? '' : 'boxes')}>
          <Box className="w-5 h-5" />
        </Btn>
        <Btn title="Toggle Grid" active={mode==='grid'} onClick={() => _setMode(mode==='grid' ? '' : 'grid')}>
          <Grid2X2 className="w-5 h-5" />
        </Btn>
        <Btn title="Show Vars" active={mode==='vars'} onClick={() => _setMode(mode==='vars' ? '' : 'vars')}>
          <Braces className="w-5 h-5" />
        </Btn>
      </div>

      {/* live CSS var readout */}
      <div id="debug-vars">
        <div className="mb-1 font-semibold flex items-center gap-1"><Bug className="w-4 h-4"/> Debug Vars</div>
        <Var name="--content-h" />
        <Var name="--feed-w" />
        <Var name="--tile" />
        <Var name="--bubble" />
        <Var name="--dock-h" />
      </div>
    </>
  );
}

function Btn({ active, onClick, title, children }: any) {
  return (
    <button
      onClick={onClick} title={title}
      className={`grid place-items-center rounded-xl border px-2 py-2 backdrop-blur
        ${active ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20 hover:bg-white/15'}`}
    >
      {children}
    </button>
  );
}

function Var({ name }: { name: string }) {
  const [val, setVal] = useState('');
  useEffect(() => {
    const read = () => setVal(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
    read();
    const ro = new ResizeObserver(read);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, [name]);
  return <div><span className="opacity-70">{name}</span>: <span className="font-semibold">{val || '(n/a)'}</span></div>;
}

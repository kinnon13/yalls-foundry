import type { AppUnitProps } from '@/apps/types';
import { useEffect, useState } from 'react';
import { listen, speak } from '@/rocker/runtime';
import { invokeAction } from '@/apps/actions';

export default function RockerEntry({ contextType }: AppUnitProps) {
  const [listening, setListening] = useState(false);
  const [stopper, setStopper] = useState<null | (() => void)>(null);

  useEffect(() => () => { if (stopper) stopper(); }, [stopper]);

  const toggleMic = () => {
    if (stopper) { stopper(); setStopper(null); setListening(false); return; }
    try {
      const stop = listen((text) => {
        speak(`Heard ${text}`);
        // simple intent: "open marketplace", "open messages", etc.
        const m = /open (\w+)/i.exec(text);
        if (m) invokeAction({ kind: 'open-app', app: m[1] as any });
        stop();
        setStopper(null);
        setListening(false);
      });
      setStopper(() => stop);
      setListening(true);
    } catch (e) { console.error(e); }
  };

  return (
    <div data-testid="app-rocker" className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rocker <span className="opacity-60">({contextType})</span></h1>
        <button
          onClick={toggleMic}
          className="px-3 py-1 rounded border"
          aria-pressed={listening}
        >{listening ? 'Stop' : 'Push-to-Talk'}</button>
      </header>

      <div className="grid gap-3">
        <button
          className="px-3 py-2 rounded border"
          onClick={() => invokeAction({ kind: 'open-app', app: 'yallbrary' })}
        >Open Yallbrary</button>

        <button
          className="px-3 py-2 rounded border"
          onClick={() => invokeAction({ kind: 'navigate', path: '/?app=messages' })}
        >Open Messages</button>
      </div>
    </div>
  );
}

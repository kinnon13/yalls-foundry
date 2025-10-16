import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PREVIEW_ITEMS } from './registry';

const enabled = import.meta.env.VITE_PREVIEW_ENABLED === 'true';

export default function PreviewRoutes() {
  if (!enabled) return null;
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading preview…</div>}>
      <Routes>
        {/* Index: simple list */}
        <Route path="/preview" element={
          <div className="p-6 space-y-6">
            <h1 className="text-xl font-semibold">Preview Index</h1>
            <ul className="space-y-3">
              {PREVIEW_ITEMS.map(i => (
                <li key={i.id}>
                  <a className="underline" href={i.path}>{i.label}</a>
                  {i.desc && <div className="text-xs text-muted-foreground">{i.desc}</div>}
                </li>
              ))}
            </ul>
          </div>
        } />
        {/* Each preview screen */}
        {PREVIEW_ITEMS.map(i => (
          <Route key={i.id} path={i.path} element={<i.Component />} />
        ))}
        <Route path="/preview/*" element={<Navigate to="/preview" replace />} />
      </Routes>
    </Suspense>
  );
}

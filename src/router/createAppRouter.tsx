import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { registerRoutes } from './registry';

function collectPaths(routes: RouteObject[], base = ''): string[] {
  const out: string[] = [];
  for (const r of routes) {
    const full = (base + '/' + (r.path ?? '')).replace(/\/+/g, '/');
    if (r.path) out.push(full === '' ? '/' : full);
    if (r.children) out.push(...collectPaths(r.children, full));
  }
  return out;
}

export function createAppRouter(routeTree: RouteObject[]) {
  const paths = collectPaths(routeTree);
  registerRoutes(paths);
  return createBrowserRouter(routeTree);
}

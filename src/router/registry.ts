// Route registry for comprehensive feature scanning
export const routeRegistry = new Set<string>();

export function registerRoutes(paths: string[]) {
  for (const p of paths) {
    routeRegistry.add(p);
  }
}

export function getRegisteredRoutes() {
  return Array.from(routeRegistry);
}

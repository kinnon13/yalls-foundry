/**
 * Architecture Export
 * 
 * Extracts routes, file organization, and architectural patterns.
 */

export type RouteInfo = {
  path: string;
  file: string;
  protected: boolean;
  guards?: string[];
};

export type FileNode = {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: FileNode[];
};

export type ArchitectureExport = {
  generated_at: string;
  routes: RouteInfo[];
  fileTree: FileNode[];
  layers: {
    ui: string[];
    lib: string[];
    routes: string[];
    tests: string[];
  };
};

/**
 * Extract route definitions from App.tsx or routes config
 */
export async function extractRoutes(): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];
  
  try {
    // Scan route files
    const routeModules = import.meta.glob('/src/routes/**/*.{ts,tsx}', { as: 'raw', eager: false });
    const appModule = import.meta.glob('/src/App.tsx', { as: 'raw', eager: false });
    
    for (const [path] of Object.entries(routeModules)) {
      const normalized = path.replace(/^\/src\/routes\//, '').replace(/\.(tsx|ts)$/, '');
      const routePath = normalized === 'index' ? '/' : `/${normalized}`;
      
      const content = String(await (routeModules[path] as () => Promise<string>)());
      const hasRequireAuth = content.includes('RequireAuth');
      const hasWithRole = content.includes('WithRole');
      const hasCan = content.includes('<Can');
      
      const guards: string[] = [];
      if (hasRequireAuth) guards.push('RequireAuth');
      if (hasWithRole) guards.push('WithRole');
      if (hasCan) guards.push('Can');
      
      routes.push({
        path: routePath,
        file: path,
        protected: guards.length > 0,
        guards: guards.length > 0 ? guards : undefined,
      });
    }
  } catch (e) {
    console.warn('Route extraction error:', e);
  }
  
  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Build file tree from glob paths
 */
export function buildFileTree(paths: string[]): FileNode[] {
  const root: Map<string, FileNode> = new Map();
  
  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      
      if (!current.has(part)) {
        current.set(part, {
          name: part,
          type: isFile ? 'file' : 'dir',
          path: parts.slice(0, i + 1).join('/'),
          children: isFile ? undefined : [],
        });
      }
      
      if (!isFile) {
        const node = current.get(part)!;
        if (!node.children) node.children = [];
        const childMap = new Map(node.children.map(c => [c.name, c]));
        current = childMap;
      }
    }
  }
  
  return Array.from(root.values());
}

/**
 * Generate full architecture export
 */
export async function exportArchitecture(): Promise<ArchitectureExport> {
  const routes = await extractRoutes();
  
  // Gather all file paths
  const allModules = import.meta.glob([
    '/src/**/*.{ts,tsx}',
    '/supabase/**/*.{ts,sql}',
    '/tests/**/*.{ts,tsx}',
  ], { as: 'raw', eager: false });
  
  const allPaths = Object.keys(allModules).map(p => p.replace(/^\//, ''));
  const fileTree = buildFileTree(allPaths);
  
  // Categorize by layer
  const layers = {
    ui: allPaths.filter(p => p.startsWith('src/components/')),
    lib: allPaths.filter(p => p.startsWith('src/lib/')),
    routes: allPaths.filter(p => p.startsWith('src/routes/')),
    tests: allPaths.filter(p => p.startsWith('tests/')),
  };
  
  return {
    generated_at: new Date().toISOString(),
    routes,
    fileTree,
    layers,
  };
}

/**
 * Generate Mermaid diagram of routes
 */
export function routesToMermaid(routes: RouteInfo[]): string {
  const lines = ['graph TD', '  Root[/]'];
  
  routes.forEach((r, i) => {
    const id = `R${i}`;
    const label = r.path === '/' ? 'Home' : r.path;
    const style = r.protected ? '{{' + label + '}}' : '[' + label + ']';
    lines.push(`  ${id}${style}`);
    
    if (r.guards) {
      lines.push(`  ${id} -.-> G${i}[${r.guards.join(', ')}]`);
    }
  });
  
  return lines.join('\n');
}

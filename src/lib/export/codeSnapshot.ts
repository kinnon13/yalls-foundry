/**
 * Code Snapshot Utilities
 * 
 * Scans app code files and creates a JSON snapshot with file contents,
 * using Vite's import.meta.glob for dynamic loading.
 */

export type SnapshotOptions = {
  routes?: boolean;
  components?: boolean;
  lib?: boolean;
  sql?: boolean;
  maxBytesPerFile?: number;
};

export type FileRecord = {
  path: string;
  size_bytes: number;
  lines: number;
  sha256: string;
  content: string;
  truncated?: boolean;
  over_150_loc?: boolean;
};

export type Snapshot = {
  generated_at: string;
  totals: {
    files: number;
    bytes: number;
  };
  files: FileRecord[];
};

/**
 * Compute SHA-256 hash of text using Web Crypto API
 */
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize file path (forward slashes, remove leading /)
 */
const normalizePath = (p: string) => p.replace(/\\/g, '/').replace(/^\//, '');

/**
 * Take a snapshot of selected code files
 */
export async function takeCodeSnapshot(opts: SnapshotOptions = {}): Promise<Snapshot> {
  const {
    routes = true,
    components = true,
    lib = true,
    sql = true,
    maxBytesPerFile = 200_000,
  } = opts;

  // MUST use literal array for Vite's static analysis
  const loaders = import.meta.glob(
    [
      '/src/routes/**/*.{ts,tsx}',
      '/src/components/**/*.{ts,tsx}',
      '/src/lib/**/*.{ts,tsx}',
      '/supabase/migrations/**/*.sql',
      '/supabase/functions/**/index.ts',
    ],
    { as: 'raw', eager: false }
  );

  if (import.meta.env.DEV && Object.keys(loaders).length === 0) {
    console.warn('[Snapshot] 0 files matched; check Vite root & leading slashes');
  }

  const files: FileRecord[] = [];
  let totalBytes = 0;

  for (const [path, loader] of Object.entries(loaders)) {
    const p = normalizePath(path);
    
    // Filter based on options
    const include =
      (routes && p.startsWith('src/routes/')) ||
      (components && p.startsWith('src/components/')) ||
      (lib && p.startsWith('src/lib/')) ||
      (sql && (p.startsWith('supabase/migrations/') || p.startsWith('supabase/functions/')));
    
    if (!include) continue;

    try {
      const content = String(await (loader as () => Promise<string>)());
      const size = new Blob([content]).size;
      const lines = content.replace(/\r\n/g, '\n').split('\n').length;
      
      let final = content;
      let truncated = false;
      if (size > maxBytesPerFile) {
        final = content.slice(0, maxBytesPerFile);
        truncated = true;
      }
      
      files.push({
        path: p,
        size_bytes: size,
        lines,
        sha256: await sha256(final),
        content: final,
        ...(truncated ? { truncated: true } : {}),
        ...(lines > 150 ? { over_150_loc: true } : {}),
      });
      
      totalBytes += size;
    } catch (e) {
      console.error('Failed to load file:', p, e);
    }
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  
  return {
    generated_at: new Date().toISOString(),
    totals: {
      files: files.length,
      bytes: totalBytes,
    },
    files,
  };
}


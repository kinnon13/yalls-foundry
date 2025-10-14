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
  public?: boolean;
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
    public: includePublic = false,
    maxBytesPerFile = 200_000,
  } = opts;

  // Use glob patterns without leading slash for better compatibility
  const loaders = import.meta.glob(
    [
      '../routes/**/*.{ts,tsx}',
      '../components/**/*.{ts,tsx}',
      '../lib/**/*.{ts,tsx}',
      '../../supabase/migrations/**/*.sql',
      '../../supabase/functions/**/index.ts',
      '../../public/**/*.{json,md,txt,css}',
    ],
    { as: 'raw', eager: false }
  );

  const files: FileRecord[] = [];
  let totalBytes = 0;

  for (const [path, loader] of Object.entries(loaders)) {
    const p = normalizePath(path);
    
    // Match relative paths from the lib/export directory
    const include =
      (routes && (p.includes('/routes/') || p.startsWith('../routes/'))) ||
      (components && (p.includes('/components/') || p.startsWith('../components/'))) ||
      (lib && (p.includes('/lib/') || p.startsWith('../lib/'))) ||
      (sql && (p.includes('/supabase/migrations/') || p.includes('/supabase/functions/'))) ||
      (includePublic && (p.includes('/public/') || p.startsWith('../../public/')));
    
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
      
      // Clean up path for display (remove ../ and leading slashes)
      const displayPath = p.replace(/^\.\.\//, 'src/').replace(/^\.\.\/\.\.\//, '');
      
      files.push({
        path: displayPath,
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


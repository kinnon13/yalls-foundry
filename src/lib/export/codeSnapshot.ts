/**
 * Code Snapshot Utilities
 * 
 * Scans app code files and creates a JSON snapshot with file contents,
 * using Vite's import.meta.glob for dynamic loading.
 */

export interface SnapshotOptions {
  routes?: boolean;
  components?: boolean;
  lib?: boolean;
  sql?: boolean;
  public?: boolean;
  maxBytesPerFile?: number;
}

export interface FileRecord {
  path: string;
  size_bytes: number;
  lines: number;
  sha256: string;
  content: string;
  truncated?: boolean;
}

export interface CodeSnapshot {
  generated_at: string;
  totals: {
    files: number;
    bytes: number;
  };
  files: FileRecord[];
}

/**
 * Compute SHA-256 hash of text using Web Crypto API
 */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize file path (forward slashes, remove leading /)
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\//, '');
}

/**
 * Take a snapshot of selected code files
 */
export async function takeCodeSnapshot(opts: SnapshotOptions = {}): Promise<CodeSnapshot> {
  const {
    routes = true,
    components = true,
    lib = true,
    sql = true,
    public: includePublic = false,
    maxBytesPerFile = 200_000,
  } = opts;

  // Define glob patterns based on options
  const patterns: string[] = [];
  if (routes) patterns.push('/src/routes/**/*.{ts,tsx}');
  if (components) patterns.push('/src/components/**/*.{ts,tsx}');
  if (lib) patterns.push('/src/lib/**/*.{ts,tsx}');
  if (sql) {
    patterns.push('/supabase/migrations/**/*.sql');
    patterns.push('/supabase/functions/**/index.ts');
  }
  if (includePublic) patterns.push('/public/**/*.{json,md,txt,css}');

  if (patterns.length === 0) {
    return {
      generated_at: new Date().toISOString(),
      totals: { files: 0, bytes: 0 },
      files: [],
    };
  }

  // Load files dynamically using Vite's glob
  const loaders = import.meta.glob(
    [
      '/src/routes/**/*.{ts,tsx}',
      '/src/components/**/*.{ts,tsx}',
      '/src/lib/**/*.{ts,tsx}',
      '/supabase/migrations/**/*.sql',
      '/supabase/functions/**/index.ts',
      '/public/**/*.{json,md,txt,css}',
    ],
    { as: 'raw', eager: false }
  );

  const fileRecords: FileRecord[] = [];
  let totalBytes = 0;

  // Process each matching file
  for (const [filePath, loader] of Object.entries(loaders)) {
    const normalizedPath = normalizePath(filePath);
    
    // Filter by enabled options
    const shouldInclude =
      (routes && normalizedPath.startsWith('src/routes/')) ||
      (components && normalizedPath.startsWith('src/components/')) ||
      (lib && normalizedPath.startsWith('src/lib/')) ||
      (sql && (normalizedPath.startsWith('supabase/migrations/') || normalizedPath.startsWith('supabase/functions/'))) ||
      (includePublic && normalizedPath.startsWith('public/'));

    if (!shouldInclude) continue;

    try {
      // Load file content dynamically
      const content = (await loader()) as string;
      const sizeBytes = new Blob([content]).size;
      const lines = content.split('\n').length;
      
      // Truncate if too large
      let finalContent = content;
      let truncated = false;
      if (sizeBytes > maxBytesPerFile) {
        finalContent = content.substring(0, maxBytesPerFile);
        truncated = true;
      }
      
      // Compute hash
      const hash = await sha256(finalContent);
      
      fileRecords.push({
        path: normalizedPath,
        size_bytes: sizeBytes,
        lines,
        sha256: hash,
        content: finalContent,
        ...(truncated && { truncated }),
      });
      
      totalBytes += sizeBytes;
    } catch (error) {
      // Skip files that can't be loaded
      console.warn(`Failed to load ${filePath}:`, error);
    }
  }

  // Sort by path for consistency
  fileRecords.sort((a, b) => a.path.localeCompare(b.path));

  return {
    generated_at: new Date().toISOString(),
    totals: {
      files: fileRecords.length,
      bytes: totalBytes,
    },
    files: fileRecords,
  };
}

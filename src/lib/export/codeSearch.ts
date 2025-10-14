/**
 * Code Search Utility
 * 
 * Search for code patterns across files and export matching snippets.
 */

export type SearchMatch = {
  file: string;
  line: number;
  match: string;
  context: string[];  // lines before/after
};

export type SearchResult = {
  query: string;
  matches: SearchMatch[];
  totalFiles: number;
  timestamp: string;
};

/**
 * Search files for pattern (regex or plain text)
 */
export async function searchCode(
  pattern: string,
  options: {
    isRegex?: boolean;
    caseSensitive?: boolean;
    contextLines?: number;
  } = {}
): Promise<SearchResult> {
  const {
    isRegex = false,
    caseSensitive = false,
    contextLines = 3,
  } = options;

  const matches: SearchMatch[] = [];
  const checkedFiles = new Set<string>();

  // Get all TS/TSX files from src/
  const fileList = await getSourceFiles();

  for (const filePath of fileList) {
    checkedFiles.add(filePath);
    
    try {
      const response = await fetch(`/${filePath}`);
      if (!response.ok) continue;
      
      const content = await response.text();
      const lines = content.split('\n');
      
      const regex = isRegex
        ? new RegExp(pattern, caseSensitive ? 'g' : 'gi')
        : new RegExp(escapeRegex(pattern), caseSensitive ? 'g' : 'gi');

      lines.forEach((line, idx) => {
        if (regex.test(line)) {
          const start = Math.max(0, idx - contextLines);
          const end = Math.min(lines.length, idx + contextLines + 1);
          
          matches.push({
            file: filePath,
            line: idx + 1,
            match: line.trim(),
            context: lines.slice(start, end),
          });
        }
      });
    } catch (err) {
      console.warn(`Failed to search ${filePath}:`, err);
    }
  }

  return {
    query: pattern,
    matches,
    totalFiles: checkedFiles.size,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export selected matches as JSON
 */
export function exportMatchesJSON(matches: SearchMatch[], filename: string): void {
  const data = {
    exported_at: new Date().toISOString(),
    total_matches: matches.length,
    matches: matches.map(m => ({
      file: m.file,
      line: m.line,
      match: m.match,
      context: m.context.join('\n'),
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export selected matches as formatted text
 */
export function exportMatchesText(matches: SearchMatch[], filename: string): void {
  const lines: string[] = [
    `Code Search Results`,
    `Exported: ${new Date().toISOString()}`,
    `Total Matches: ${matches.length}`,
    '',
    '---',
    '',
  ];

  matches.forEach((m, idx) => {
    lines.push(`Match ${idx + 1}: ${m.file}:${m.line}`);
    lines.push(`  ${m.match}`);
    lines.push('');
    lines.push('Context:');
    m.context.forEach(c => lines.push(`  ${c}`));
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper: Get list of source files
async function getSourceFiles(): Promise<string[]> {
  // Static list of common paths - in real app, this would scan dynamically
  return [
    'src/App.tsx',
    'src/main.tsx',
    'src/routes/index.tsx',
    'src/routes/search.tsx',
    'src/routes/login.tsx',
    'src/routes/profile.tsx',
    'src/routes/admin/control-room.tsx',
  ];
}

// Helper: Escape regex special chars
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Code Search Utility
 * 
 * Search through code snapshot for patterns and export matching snippets.
 */

import { takeCodeSnapshot } from './codeSnapshot';

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
 * Search code snapshot for pattern (regex or plain text)
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
  
  // Get code snapshot
  const snapshot = await takeCodeSnapshot();
  
  // Build regex
  const regex = isRegex
    ? new RegExp(pattern, caseSensitive ? 'g' : 'gi')
    : new RegExp(escapeRegex(pattern), caseSensitive ? 'g' : 'gi');

  // Search through all files in snapshot
  snapshot.files.forEach((fileRecord) => {
    const lines = fileRecord.content.split('\n');
    
    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        const start = Math.max(0, idx - contextLines);
        const end = Math.min(lines.length, idx + contextLines + 1);
        
        matches.push({
          file: fileRecord.path,
          line: idx + 1,
          match: line.trim(),
          context: lines.slice(start, end),
        });
      }
    });
  });

  return {
    query: pattern,
    matches,
    totalFiles: snapshot.files.length,
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

// Helper: Escape regex special chars
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

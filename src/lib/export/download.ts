/**
 * Export & Download Utilities
 * 
 * Provides functions for exporting data as JSON/CSV and copying to clipboard.
 * Works in browser environments only.
 */

/**
 * Convert array of objects to CSV format
 */
export function toCSV(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  
  const allKeys = new Set<string>();
  rows.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
  const headers = Array.from(allKeys);
  
  const needsQuoting = (s: string) => 
    s.includes(',') || s.includes('\n') || s.includes('\r') || s.includes('"');
  
  const escapeCSV = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (!needsQuoting(s)) return s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  
  const head = headers.join(',');
  const body = rows
    .map(r => headers.map(h => escapeCSV((r as Record<string, unknown>)[h])).join(','))
    .join('\n');
  
  return [head, body].filter(Boolean).join('\n');
}

/**
 * Download data as JSON file
 */
export function downloadJSON(filename: string, data: unknown): void {
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
 * Download data as CSV file
 */
export function downloadCSV(filename: string, rows: Array<Record<string, unknown>>): void {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv' });
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
 * Copy text to clipboard
 * Falls back to textarea method if clipboard API unavailable
 */
export async function copy(text: string): Promise<void> {
  // Try modern clipboard API first
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
      // Fall through to fallback
    }
  }
  
  // Fallback: textarea method (works in more contexts)
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.width = '2em';
  ta.style.height = '2em';
  ta.style.padding = '0';
  ta.style.border = 'none';
  ta.style.outline = 'none';
  ta.style.boxShadow = 'none';
  ta.style.background = 'transparent';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  
  try {
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand failed');
    }
  } catch (err) {
    console.error('All copy methods failed:', err);
    throw new Error('Failed to copy to clipboard');
  } finally {
    document.body.removeChild(ta);
  }
}


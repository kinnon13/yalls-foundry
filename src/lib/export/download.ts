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
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to fallback
    }
  }
  
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}


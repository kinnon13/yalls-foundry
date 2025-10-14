/**
 * Export & Download Utilities
 * 
 * Provides functions for exporting data as JSON/CSV and copying to clipboard.
 * Works in browser environments only.
 */

/**
 * Download data as JSON file
 */
export function downloadJSON(filename: string, data: any): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
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
 * Convert array of objects to CSV format
 */
export function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return '';
  
  // Collect all unique keys across all rows
  const allKeys = new Set<string>();
  rows.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Helper to escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // If contains comma, newline, or quote, wrap in quotes and escape inner quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // Build CSV string
  const lines: string[] = [];
  
  // Header row
  lines.push(headers.map(escapeCSV).join(','));
  
  // Data rows
  rows.forEach(row => {
    const values = headers.map(header => escapeCSV(row[header]));
    lines.push(values.join(','));
  });
  
  return lines.join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(filename: string, rows: Record<string, any>[]): void {
  const csvStr = toCSV(rows);
  const blob = new Blob([csvStr], { type: 'text/csv' });
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
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to fallback
    }
  }
  
  // Fallback: use textarea
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  
  textarea.select();
  document.execCommand('copy');
  
  document.body.removeChild(textarea);
}

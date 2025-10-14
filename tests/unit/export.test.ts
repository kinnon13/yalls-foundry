/**
 * Unit Tests: Export Utilities
 */

import { describe, it, expect } from 'vitest';
import { toCSV } from '@/lib/export/download';

describe('toCSV', () => {
  it('should handle empty array', () => {
    expect(toCSV([])).toBe('');
  });

  it('should create header with union of all keys', () => {
    const rows: Array<Record<string, unknown>> = [
      { name: 'test1', value: 10 },
      { name: 'test2', other: 'data' },
    ];
    
    const csv = toCSV(rows);
    const lines = csv.split('\n');
    
    // Header should contain all unique keys
    expect(lines[0]).toContain('name');
    expect(lines[0]).toContain('value');
    expect(lines[0]).toContain('other');
  });

  it('should generate correct number of lines', () => {
    const rows: Array<Record<string, unknown>> = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    
    const csv = toCSV(rows);
    const lines = csv.split('\n');
    
    // 1 header + 2 data rows
    expect(lines).toHaveLength(3);
  });

  it('should escape values with commas', () => {
    const rows: Array<Record<string, unknown>> = [
      { text: 'hello, world' },
    ];
    
    const csv = toCSV(rows);
    
    // Value with comma should be wrapped in quotes
    expect(csv).toContain('"hello, world"');
  });

  it('should escape values with quotes', () => {
    const rows: Array<Record<string, unknown>> = [
      { text: 'say "hello"' },
    ];
    
    const csv = toCSV(rows);
    
    // Quotes should be escaped by doubling
    expect(csv).toContain('""hello""');
  });

  it('should escape values with newlines (\\n and \\r)', () => {
    const rows: Array<Record<string, unknown>> = [
      { text: 'line1\nline2' },
      { text: 'line1\r\nline2' },
    ];
    
    const csv = toCSV(rows);
    
    // Values with newlines should be wrapped in quotes
    expect(csv).toContain('"line1\nline2"');
    expect(csv).toContain('"line1\r\nline2"');
  });

  it('should handle null and undefined values', () => {
    const rows: Array<Record<string, unknown>> = [
      { a: null, b: undefined, c: 'ok' },
    ];
    
    const csv = toCSV(rows);
    const lines = csv.split('\n');
    
    // Should have header + 1 data row
    expect(lines).toHaveLength(2);
    
    // Null/undefined should become empty strings
    expect(lines[1]).toContain(',,ok');
  });

  it('should handle rows with different keys (union of keys)', () => {
    const rows: Array<Record<string, unknown>> = [
      { kind: 'health', name: 'test1', ok: true },
      { kind: 'synthetic', name: 'test2', ok: false, duration_ms: 100 },
    ];
    
    const csv = toCSV(rows);
    const lines = csv.split('\n');
    
    // Should have 3 lines: header + 2 data rows
    expect(lines).toHaveLength(3);
    
    // Header should have all keys
    const header = lines[0];
    expect(header).toContain('kind');
    expect(header).toContain('name');
    expect(header).toContain('ok');
    expect(header).toContain('duration_ms');
  });
});

/**
 * Synthetic Results Serialization
 * 
 * Converts synthetic check results to flat row format for CSV export.
 */

export type Row = {
  kind: string;
  name: string;
  ok: boolean | null;
  duration_ms: number | null;
  message: string;
};

type Synthetic = {
  name: string;
  ok: boolean;
  duration_ms?: number;
  message?: string;
};

/**
 * Convert synthetic results to CSV-friendly row format
 */
export function syntheticResultsToRows(results: Synthetic[], kind: string): Row[] {
  return results.map(r => ({
    kind,
    name: r.name,
    ok: r.ok,
    duration_ms: r.duration_ms ?? null,
    message: r.message ?? '',
  }));
}


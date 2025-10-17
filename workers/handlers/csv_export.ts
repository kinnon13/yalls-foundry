import { createClient } from '@supabase/supabase-js';
import { enqueue } from '../util-enqueue';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handleCsv(job: {
  type: 'csv_export'; table: string; where?: Record<string, string | number>; userId: string;
}) {
  let query = supabaseAdmin.from(job.table).select('*');
  for (const [k, v] of Object.entries(job.where ?? {})) query = query.eq(k, v);

  const { data, error } = await query;
  if (error) throw error;

  const cols = data.length ? Object.keys(data[0]) : [];
  const lines = [cols.join(','), ...data.map((row: any) => cols.map((c) => JSON.stringify(row[c] ?? '')).join(','))];
  const csv = lines.join('\n');

  const path = `exports/${job.userId}/${job.table}-${Date.now()}.csv`;
  const { error: upErr } = await supabaseAdmin.storage.from('exports').upload(path, new Blob([csv], { type: 'text/csv' }), { upsert: true });
  if (upErr) throw upErr;

  const { data: signed } = await supabaseAdmin.storage.from('exports').createSignedUrl(path, 60 * 60 * 24);

  await enqueue({ type: 'notif', userId: job.userId, lane: 'exports', payload: { kind: 'csv_ready', url: signed?.signedUrl, path, table: job.table, rows: data.length } });
}

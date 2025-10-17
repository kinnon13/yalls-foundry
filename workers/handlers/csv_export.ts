/**
 * CSV Export Handler
 * Generates CSV files and uploads to Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import { enqueue } from '../queue';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function handleCsv(job: {
  table: string;
  where?: Record<string, any>;
  userId: string;
}) {
  console.log(`[CSV] Exporting ${job.table} for user ${job.userId}`);

  // Build query
  let query = supabaseAdmin.from(job.table).select('*');
  
  if (job.where) {
    Object.entries(job.where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;
  if (error) throw error;

  // Generate CSV
  const cols = data.length ? Object.keys(data[0]) : [];
  const lines = [
    cols.join(','),
    ...data.map((row: any) =>
      cols.map((c) => JSON.stringify(row[c] ?? '')).join(',')
    ),
  ];
  const csv = lines.join('\n');

  // Upload to storage
  const path = `exports/${job.userId}/${job.table}-${Date.now()}.csv`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('exports')
    .upload(path, new Blob([csv], { type: 'text/csv' }), {
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Generate signed URL (24h expiry)
  const { data: signedData } = await supabaseAdmin.storage
    .from('exports')
    .createSignedUrl(path, 60 * 60 * 24);

  // Notify user
  await enqueue({
    type: 'notif',
    userId: job.userId,
    lane: 'exports',
    payload: {
      kind: 'csv_ready',
      url: signedData?.signedUrl,
      path,
      table: job.table,
      rows: data.length,
    },
  });

  console.log(`[CSV] Exported ${data.length} rows to ${path}`);
}

// scripts/seed-phase1.ts
// deno run -A scripts/seed-phase1.ts
// or: node + install @supabase/supabase-js and load env
import 'https://deno.land/x/dotenv/load.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const items = [
  { kind: 'business', name: 'Wild River Stables', handle: 'wild-river-stables', window: 'contributor.60' },
  { kind: 'horse',    name: 'Starfire',           handle: 'starfire',            window: 'contributor.30' },
  { kind: 'person',   name: 'Casey Morales',      handle: 'casey-morales',       window: 'contributor.90' },
  { kind: 'event',    name: 'Spring Classic Show 2025', handle: 'spring-classic-2025', window: 'contributor.60' },
] as const;

const { data: firstProfile } = await supabase
  .from('profiles')
  .select('user_id')
  .order('created_at', { ascending: true })
  .limit(1)
  .maybeSingle();

for (const it of items) {
  const { data, error } = await supabase.rpc('entity_create_unclaimed', {
    p_kind: it.kind,
    p_display_name: it.name,
    p_handle: it.handle,
    p_provenance: { source: 'seed', import_batch_id: 'phase1-demo' },
    p_contributor_user_id: firstProfile?.user_id ?? null,
    p_window_key: it.window
  });
  if (error) console.error('Seed error:', it, error.message);
  else console.log('Seeded:', it.kind, it.name, '→', data);
}
console.log('Done.');

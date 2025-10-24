/**
 * Role: Seed script to populate Yallbrary app registry with fake apps
 * Path: yalls-inc/yallbrary/scripts/seed-apps.js
 * Usage: node yalls-inc/yallbrary/scripts/seed-apps.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleApps = [
  {
    id: 'yalls-social',
    title: 'Yalls Social',
    description: 'TikTok-style feeds with viral engagement scoring',
    category: 'social',
    is_public: true,
  },
  {
    id: 'yallmart',
    title: 'Yall Mart',
    description: 'One-tap shopping from social feeds',
    category: 'shopping',
    is_public: true,
  },
  {
    id: 'yalls-ai',
    title: 'Yalls AI',
    description: 'Tiered AI assistant (role-based capabilities)',
    category: 'ai',
    is_public: true,
  },
  {
    id: 'yallspay',
    title: 'YallsPay',
    description: 'Residuals and MLM commission tracking',
    category: 'finance',
    is_public: true,
  },
  {
    id: 'yalls-business',
    title: 'Yalls Business',
    description: 'CRM and ops for business owners',
    category: 'business',
    is_public: false,
  },
];

async function seed() {
  console.log('🌱 Seeding Yallbrary apps...');

  const { data, error } = await supabase
    .from('yallbrary_apps')
    .upsert(sampleApps, { onConflict: 'id' });

  if (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  console.log(`✅ Seeded ${sampleApps.length} apps`);
}

seed();

/**
 * Role: Seed script to populate viral social posts with fake data
 * Path: yalls-inc/yalls-social/scripts/seed-feeds.js
 * Usage: node yalls-inc/yalls-social/scripts/seed-feeds.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate viral posts with realistic engagement
function generatePosts(count) {
  const posts = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const hoursAgo = Math.floor(Math.random() * 72); // 0-72 hours old
    const createdAt = new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();
    
    const likesCount = Math.floor(Math.random() * 1000) + 10;
    const commentsCount = Math.floor(Math.random() * 100);
    
    // Calculate viral score
    const freshnessFactor = Math.exp(-hoursAgo / 24);
    const viralScore = likesCount * freshnessFactor;

    posts.push({
      user_id: `user-${Math.floor(Math.random() * 100)}`,
      content: `Viral post ${i + 1}: Check out this amazing content!`,
      media_url: `https://picsum.photos/seed/${i}/800/600`,
      likes_count: likesCount,
      comments_count: commentsCount,
      viral_score: viralScore,
      product_id: Math.random() > 0.5 ? `product-${Math.floor(Math.random() * 50)}` : null,
      created_at: createdAt,
    });
  }

  return posts;
}

async function seed() {
  console.log('🌱 Seeding Yalls Social posts...');

  const posts = generatePosts(100);

  const { data, error } = await supabase
    .from('yalls_social_posts')
    .insert(posts);

  if (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  console.log(`✅ Seeded ${posts.length} viral posts`);
  console.log(`📊 Viral score range: ${Math.min(...posts.map(p => p.viral_score)).toFixed(1)} - ${Math.max(...posts.map(p => p.viral_score)).toFixed(1)}`);
}

seed();

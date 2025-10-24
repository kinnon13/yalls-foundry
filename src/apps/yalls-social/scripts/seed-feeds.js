/**
 * Role: Seed fake viral feeds
 * Path: src/apps/yalls-social/scripts/seed-feeds.js
 */

const samplePosts = [
  {
    id: 'post-1',
    content: 'Check out this amazing product! 🔥',
    likes: 1500,
    freshness: 2,
    author: '@creator123',
  },
  {
    id: 'post-2',
    content: 'Just hit 10K followers! Thank you all! 🎉',
    likes: 2300,
    freshness: 1,
    author: '@viral_star',
  },
  {
    id: 'post-3',
    content: 'New tutorial dropping tomorrow! Stay tuned 📺',
    likes: 890,
    freshness: 5,
    author: '@tech_guru',
  },
];

console.log('Seeding social feeds:', samplePosts);

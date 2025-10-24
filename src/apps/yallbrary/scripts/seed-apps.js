/**
 * Role: Seed fake data for yallbrary apps
 * Path: src/apps/yallbrary/scripts/seed-apps.js
 */

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
];

console.log('Seed data:', sampleApps);

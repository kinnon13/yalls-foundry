# Yalls Social - TikTok-Style Feeds

**Role**: AI-curated social feeds with viral engagement scoring and embedded shopping (Yall Mart).

## Features
- Infinite scroll feeds with sharded database queries (userId % 64)
- Viral engagement scoring (likes × freshness decay)
- One-tap shopping embedded in feed posts
- AI content curation and ranking
- Real-time engagement tracking

## Structure
- `src/` - React components, services, hooks
- `supabase/functions/yalls-social/` - Edge function for feed API
- `libs/` - Engagement scorer, viral ranking utilities
- `scripts/` - Seed viral posts
- `cypress/e2e/` - Infinite scroll tests
- `k6/` - Load testing (10K concurrent scrolls)
- `ops/` - Deploy and scale scripts
- `sec/` - Content moderation policies

## Quick Start
```bash
npm run dev
# Visit http://localhost:5173/feed
npx cypress run --spec cypress/e2e/feed.spec.cy
k6 run k6/load-scroll.js
```

## API Contract
- **ID**: `yalls-social`
- **Role**: `user` (all authenticated users)
- **Routes**: `/feed`, `/post/:postId`, `/profile/:userId`

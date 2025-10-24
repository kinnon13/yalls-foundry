# Yalls Social Guide

Social feed with viral scoring and marketplace integration.

## Features
- AI-curated infinite scroll feed
- Viral scoring algorithm: `likes * exp(-freshness/24)`
- One-tap shopping with embedded QuickBuy
- Responsive grid (1 col mobile, 2 tablet, 3 desktop)

## Architecture
- Sharded queries: `userId % 64`
- TanStack infinite query for scroll
- Embedded marketplace components

## Testing
- `cypress/e2e/feed.spec.cy` - Infinite scroll test
- `k6/load-scroll.js` - 10K concurrent scrolls

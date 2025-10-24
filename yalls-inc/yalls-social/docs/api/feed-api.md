# Yalls Social Feed API

## Endpoints

### GET /yalls_social_posts
Fetch viral feed posts ordered by viral_score
- **Auth**: Required (user role)
- **Query params**: 
  - `limit`: Number of posts per page (default: 20)
  - `offset`: Pagination offset
- **Response**: `FeedPost[]`

### POST /yalls_social_posts
Create new social post
- **Auth**: Required
- **Body**: `{ user_id, content, media_url?, product_id? }`
- **Response**: `201 Created`

### POST /yalls_social_likes
Like a post
- **Auth**: Required
- **Body**: `{ post_id, user_id }`
- **Response**: `201 Created` or `409 Conflict` (already liked)

### RPC increment_post_likes
Increment post likes count atomically
- **Auth**: Required
- **Params**: `{ post_id }`
- **Response**: `200 OK`

## Sharding Strategy
- Feed queries use `userId % 64` for shard routing
- Future: Distribute across 64 database shards

## Viral Scoring
Formula: `likes_count × e^(-hours_old / 24)`
- Freshness decay: Half-life of 24 hours
- Recalculated on every feed fetch

## RLS Policies
- Users can view all public posts
- Users can create/delete only their own posts
- Admins can moderate any content

# Production Deployment Guide

## Environment Variables

### Frontend (Vite)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_REDIS_URL=rediss://:password@host:port
VITE_SENTRY_DSN=https://...@sentry.io/...  # optional
VITE_COMMIT_SHA=abc123                      # optional
```

### Worker (Node.js)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # service key (server-only!)
REDIS_URL=rediss://...
JOBS_QUEUE=jobs:main
```

## Infrastructure Setup

### 1. Redis (Upstash or Managed)
- Sign up at [Upstash](https://upstash.com) for serverless Redis
- Create a database and copy the `rediss://` URL
- Set as `VITE_REDIS_URL` and `REDIS_URL`

### 2. Storage Bucket
Create the exports bucket in Supabase:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false);

-- RLS policy for exports
CREATE POLICY "Users can view own exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Worker Process
Deploy worker to Railway/Render/Fly.io:
```bash
# Install dependencies
npm install

# Build worker
npm run build

# Run worker
node dist/workers/index.js
```

**Dockerfile** (optional):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/workers/index.js"]
```

## Cloudflare Setup

### Caching Rules
1. **Static Assets**: `/assets/*` → Cache Everything, Edge TTL 1 year
2. **API Bypass**: `/rpc/*`, `/health` → Bypass Cache
3. **SPA Routes**: `/` → Standard (dynamic HTML)

### Rate Limiting
1. **API**: `/rpc/*` → 100 req/min per IP
2. **Payments**: `/payments/*` → 60 req/min per IP
3. **Auth**: `/auth/*` → 20 req/min per IP

### Security
- Bot Fight Mode: **ON**
- Security Level: **Medium**
- Hotlink Protection: **ON**
- Email Obfuscation: **ON**

## Load Testing

Run k6 smoke test:
```bash
k6 run loadtest.js
```

Target thresholds:
- Error rate: < 2%
- p95 latency: < 300ms
- Success rate: > 98%

## Monitoring

### Sentry
```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_COMMIT_SHA,
  tracesSampleRate: 0.2
});
```

### Health Checks
- Endpoint: `GET /health`
- Expected: `{ ok: true, db: "up", redis: "up" }`
- Monitor via GitHub Actions or external service

## Deployment Checklist

- [ ] Set all environment variables
- [ ] Deploy worker process with service key
- [ ] Create `exports` storage bucket
- [ ] Apply Cloudflare rules
- [ ] Run k6 load test (p95 < 300ms)
- [ ] Configure Sentry monitoring
- [ ] Set up uptime monitoring
- [ ] Test CSV export flow
- [ ] Verify notifications work
- [ ] Test feed caching (check Redis)

## Scaling Considerations

### Horizontal
- **Web**: Auto-scale on Vercel/Netlify
- **Worker**: Deploy 2+ replicas behind load balancer
- **Redis**: Upstash auto-scales; upgrade tier if needed

### Vertical
- **DB**: Monitor connections via PgBouncer; upgrade Supabase plan
- **Redis**: Upgrade Upstash tier for more memory
- **Worker**: Increase memory if CSV exports timeout

## Cost Estimates (1M users)

- **Supabase**: ~$25-50/mo (Pro plan)
- **Redis**: ~$10-20/mo (Upstash)
- **Worker**: ~$5-10/mo (Railway/Render)
- **CDN**: ~$0 (Cloudflare Free)
- **Total**: ~$40-80/mo for 1M MAU

## Troubleshooting

### High Redis Memory
- Reduce TTLs (feed: 60s → 30s)
- Add random jitter to prevent stampede
- Clear old keys: `redis-cli --scan --pattern "feed:*" | xargs redis-cli del`

### Worker Crashes
- Check logs for unhandled errors
- Increase memory allocation
- Add retry logic with exponential backoff

### Slow Feed Load
- Check Redis hit rate (should be > 80%)
- Monitor RPC execution time in Supabase
- Consider adding DB indexes on `created_at`, `entity_id`

## Security

- **Service Key**: NEVER expose in frontend; worker-only
- **RLS**: Enabled on all tables; test with different users
- **CORS**: Restricted to your domain in production
- **Rate Limits**: Enforce at edge (Cloudflare) + DB (RPC)

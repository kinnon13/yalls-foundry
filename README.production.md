# Production Deployment Guide

## Infrastructure Setup

### 1. Redis (Required for caching & queues)

**Option A: Local (Development)**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Option B: Managed (Production)**
- Upstash: https://upstash.com (Recommended - serverless)
- Redis Cloud: https://redis.com/try-free
- Railway: https://railway.app

Set environment variable:
```bash
VITE_REDIS_URL=redis://localhost:6379
# Or for Upstash:
VITE_REDIS_URL=rediss://default:password@endpoint.upstash.io:6379
```

### 2. Storage Bucket (CSV Exports)

Create storage bucket in Supabase:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false);

-- RLS policy for user-owned exports
CREATE POLICY "Users can access own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. PgBouncer (Connection Pooling)

For Supabase projects, enable PgBouncer from dashboard:
1. Go to Database → Connection Pooling
2. Enable Transaction mode
3. Update connection string to use port 6543

### 4. Environment Variables

Required for production:
```bash
# Supabase (auto-configured)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Redis (required for caching)
VITE_REDIS_URL=redis://your-redis-url

# Observability (optional but recommended)
VITE_SENTRY_DSN=your_sentry_dsn
VITE_COMMIT_SHA=git_commit_hash

# Production flag
NODE_ENV=production
```

### 5. Worker Process

The background worker processes CSV exports and notifications.

**Deploy worker separately:**
```bash
# Build first
npm run build

# Start worker
node dist/workers/index.js
```

**Using PM2:**
```bash
pm2 start dist/workers/index.js --name worker
pm2 save
```

**Using systemd:**
```ini
[Unit]
Description=Y'alls Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/yalls
ExecStart=/usr/bin/node dist/workers/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

### 6. Cloudflare (CDN + WAF)

**Cache Rules:**
1. Path: `/assets/*` → Cache Everything, 1 year TTL
2. Path: `/` Method: GET → Cache Everything, 60s TTL, Bypass cookies

**Rate Limit Rules:**
1. `/rpc/*` → 100 req/min/IP, burst 30
2. `/auth/*` → 20 req/min/IP
3. `/*` → Block if > 1000 req/5min from same IP

**Security:**
- Enable Bot Fight Mode
- Set Security Level to Medium
- Enable Email Obfuscation
- Enable Hotlink Protection

## Health Checks

The `/health` endpoint returns system status:
```json
{
  "ok": true,
  "db": "up",
  "redis": "configured",
  "time": "2025-01-01T00:00:00.000Z",
  "version": "abc123"
}
```

Set up monitoring:
- Uptime Robot: https://uptimerobot.com
- Better Uptime: https://betteruptime.com
- Or use GitHub Actions (`.github/workflows/uptime.yml`)

## Load Testing

Run load tests with k6:
```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io

# Run test
k6 run loadtest.js

# With custom target
k6 run -e BASE_URL=https://your-domain.com loadtest.js
```

**Targets:**
- p95 latency < 300ms
- Error rate < 2%
- Throughput > 100 req/s

## Monitoring

**Sentry (Errors & Performance):**
1. Create project at https://sentry.io
2. Add DSN to `VITE_SENTRY_DSN`
3. Errors auto-reported with stack traces
4. Performance traces sampled at 10%

**Database Metrics:**
Check these in Supabase dashboard:
- Connection count (should stay below pool size)
- Query duration (p95 < 100ms)
- Cache hit ratio (> 90%)

## Scaling Checklist

**Phase 1: 0-100K users (Current)**
- ✅ RLS policies enabled
- ✅ Connection pooling (PgBouncer)
- ✅ Redis caching (60s TTL)
- ✅ CDN caching (Cloudflare)
- ✅ Edge rate limiting
- ✅ Background workers
- ✅ Health checks
- ⏳ Load testing

**Phase 2: 100K-1M users**
- Add read replicas
- Increase worker replicas (2-3)
- Add Redis Cluster
- Implement cache warming
- Add database partitioning

**Phase 3: 1M+ users**
- Multi-region deployment
- Database sharding
- Advanced caching strategies
- Dedicated worker infrastructure

## Deployment Platforms

**Recommended Stack:**
- Frontend: Vercel / Netlify
- Worker: Railway / Render
- Database: Supabase (managed)
- Cache: Upstash Redis
- CDN: Cloudflare

**Single Platform (Easier):**
- Railway: https://railway.app (All-in-one)
- Render: https://render.com (Web + Worker)

## Security Checklist

- ✅ RLS policies on all tables
- ✅ API rate limiting (DB + Edge)
- ✅ CORS properly configured
- ✅ Service keys never exposed
- ✅ Secrets in environment variables
- ✅ Error messages scrubbed (no PII)
- ✅ Auth required for mutations
- ✅ Input validation on all forms

## Cost Estimates

**Development (Free tier):**
- Supabase: $0 (Free tier)
- Upstash Redis: $0 (10K commands/day free)
- Cloudflare: $0 (Free plan)
- Sentry: $0 (5K events/month)
**Total: $0/month**

**Production (Small scale):**
- Supabase Pro: $25/month
- Upstash Redis: $10/month (100K commands/day)
- Cloudflare Pro: $20/month (optional)
- Sentry: $26/month (50K events)
- Worker hosting: $5-10/month
**Total: ~$60-85/month**

**Production (100K users):**
- Supabase Team: $599/month
- Upstash Redis: $40/month
- Cloudflare Business: $200/month
- Sentry: $80/month
- Worker hosting: $50/month
**Total: ~$970/month**

## Troubleshooting

**High latency:**
1. Check Redis is connected: `VITE_REDIS_URL` set?
2. Verify CDN cache hits in Cloudflare analytics
3. Check DB connection pool not exhausted
4. Review Sentry performance traces

**Worker not processing jobs:**
1. Check worker is running: `ps aux | grep worker`
2. Verify Redis connection: `redis-cli ping`
3. Check worker logs for errors
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

**Rate limit errors:**
1. User hitting edge limits? Check Cloudflare WAF logs
2. DB rate limit? Check `rate_limit_counters` table
3. Adjust thresholds if legitimate traffic

## Support

- Supabase Discord: https://discord.supabase.com
- Railway Discord: https://discord.gg/railway
- Sentry Docs: https://docs.sentry.io

---

**Next Steps:**
1. Set up Redis (Upstash free tier)
2. Deploy worker process
3. Configure Cloudflare cache rules
4. Run load test (`k6 run loadtest.js`)
5. Set up health monitoring

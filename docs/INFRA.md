# Infrastructure Setup (PR-I1)

This document outlines the infrastructure configuration needed for production scale.

## 1. Database Connection Pooling (PgBouncer)

**Goal:** Prevent connection exhaustion under load

### Supabase Configuration:
1. Go to Database Settings → Connection Pooling
2. Enable PgBouncer in **Transaction Mode**
3. Set pool size: 50-100 connections
4. Update Postgres `max_connections`: 200

### Application Changes:
```typescript
// Use pooled connection for app queries
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const POOLED_URL = SUPABASE_URL.replace('.supabase.co', '-pooler.supabase.co');

// For admin tools, use direct connection
// For app queries, use POOLED_URL
```

**Expected Impact:**
- DB connections stay flat under 200 RPS
- No connection exhaustion at 1K+ concurrent users

---

## 2. CDN Configuration (Cloudflare)

**Goal:** Reduce origin load and improve global latency

### Setup:
1. Add domain to Cloudflare
2. Point DNS to your app origin
3. Enable these features:
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - Browser Cache TTL: "Respect Existing Headers"
   - Caching Level: Standard

### Cache Rules:
```
Static Assets (/*.{js,css,png,jpg,svg,woff2}):
  - Cache Level: Cache Everything
  - Edge TTL: 1 year
  - Browser TTL: 1 year

API Routes (/rest/*, /rpc/*):
  - Cache Level: Standard
  - Edge TTL: 30s
  - Browser TTL: per Cache-Control header
```

### Rate Limiting (Cloudflare WAF):
```
/rpc/* and /rest/*:
  - 100 requests/min per IP
  - Burst: 30 requests

/auth/*:
  - 20 requests/min per IP
  - Challenge on 5th failed login

Bot Fight Mode: ON
```

**Expected Impact:**
- 70%+ cache hit rate for static assets
- 30%+ cache hit rate for feed JSON
- Origin RPS reduced by 50-70%
- Global p95 latency < 200ms

---

## 3. Redis Cache Layer

**Goal:** Reduce database load for hot-path queries

### Setup (Upstash Redis):
1. Create Redis database: https://upstash.com/
2. Add `VITE_REDIS_URL` to environment variables
3. Code is already Redis-ready (see `src/lib/cache/redis.ts`)

### Cache Strategy:
```typescript
// Feed queries - 30s TTL
feed:{version}:{user}:{lane}:{cursor} → JSON

// Profile lookups - 5min TTL  
profile:{version}:{userId} → JSON

// Version bumping (invalidation):
version:feed → increment on any post/target write
version:profiles → increment on profile update
```

### Cache Invalidation:
```typescript
// On write operations that affect feeds:
await bumpCacheVersion('feed');

// On profile updates:
await bumpCacheVersion('profiles');
```

**Expected Impact:**
- 80%+ cache hit rate for repeated feed loads
- p95 feed latency < 120ms (warm) / < 250ms (cold)
- DB query volume reduced by 60-80%

---

## 4. Monitoring Setup

### Sentry Configuration:
1. Create project: https://sentry.io/
2. Add `VITE_SENTRY_DSN` to environment
3. Error tracking is auto-configured (10% sample rate)

### Grafana Dashboard:
Create dashboard with these widgets:

**Database Health:**
- Active connections (target: < 80)
- Query p95 latency (target: < 100ms)
- Slow queries (> 500ms)

**Cache Performance:**
- Hit rate by key pattern (target: > 70%)
- Miss rate trend
- Stampede events

**Rate Limiting:**
- Requests blocked by rate limit
- Top offending IPs
- Auth failures per minute

### Query for metrics:
```sql
-- RPC performance (last hour)
SELECT 
  rpc_name,
  COUNT(*) as calls,
  AVG(duration_ms) as avg_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_ms,
  COUNT(*) FILTER (WHERE status = 'error') as errors
FROM rpc_observations
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY rpc_name
ORDER BY p95_ms DESC;

-- Cache performance
SELECT 
  meta->>'cache_result' as cache_result,
  COUNT(*) as count,
  AVG(duration_ms) as avg_ms
FROM rpc_observations
WHERE meta->>'cache_result' IS NOT NULL
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY cache_result;
```

---

## 5. Performance Targets

### Load Test Scenarios:
1. **Auth brute force**: 100 login attempts/sec → blocked at 20/min
2. **Feed scraping**: 200 feed requests/sec → 70%+ cache hit
3. **Action spam**: 50 post creates/sec → rate limited, no DB saturation

### SLO Targets:
- **Availability**: 99.9% uptime
- **Error Rate**: ≤ 2%
- **p95 Latency**: ≤ 250ms
- **Cache Hit Rate**: ≥ 70% (static), ≥ 30% (API)

---

## Infrastructure Checklist

- [ ] PgBouncer enabled (transaction mode, pool size 50-100)
- [ ] Cloudflare CDN configured with cache rules
- [ ] WAF rate limits set (100/min API, 20/min auth)
- [ ] Redis provisioned and VITE_REDIS_URL set
- [ ] Sentry configured with VITE_SENTRY_DSN
- [ ] Grafana dashboard created with DB + cache metrics
- [ ] Load testing performed (auth, feed, actions)
- [ ] SLO monitoring alerts configured
- [ ] Static assets have immutable cache headers
- [ ] API responses have appropriate Cache-Control headers

---

## Next Steps After PR-I1

Once infrastructure is stable:
1. **Code cleanup**: Remove legacy columns, consolidate functions
2. **UI Polish**: Complete dashboard modules, mobile optimization
3. **Testing**: E2E tests, CI/CD pipeline
4. **Phase 2**: Partitioning, multi-region, advanced observability

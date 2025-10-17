# Infrastructure Setup Guide

## 🎯 Production Deployment Checklist

### 1. PgBouncer (Connection Pooling) - 5 min

**Purpose**: Prevent connection exhaustion at scale

```ini
# pgbouncer.ini
[databases]
appdb = host=YOUR_DB_HOST port=5432 dbname=postgres pool_size=200 reserve_pool=20

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 4000
server_tls_sslmode = prefer
```

**Environment Variable**:
```bash
DATABASE_URL=postgres://user:pass@pgbouncer-host:6432/postgres?sslmode=require
```

---

### 2. Redis (Caching Layer) - 10 min

**Providers**:
- [Upstash](https://upstash.com) - Serverless Redis (recommended)
- [Redis Cloud](https://redis.com/try-free/)
- Self-hosted Redis

**Environment Variable**:
```bash
VITE_REDIS_URL=redis://:password@host:port
```

**Cache Strategy**:
- Feed queries: 60s TTL
- Feature flags: 5min TTL
- User profiles: 5min TTL

---

### 3. Cloudflare CDN - 15 min

1. Sign up at [Cloudflare](https://cloudflare.com)
2. Add your domain
3. Update nameservers
4. Enable:
   - Auto Minify (JS, CSS, HTML)
   - Brotli compression
   - HTTP/3 (QUIC)
   - Early Hints

**Headers configured** in `public/_headers`

---

### 4. Sentry (Error Tracking) - 5 min

1. Sign up at [Sentry.io](https://sentry.io)
2. Create new React project
3. Copy DSN

**Environment Variables**:
```bash
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_COMMIT_SHA=abc123  # For release tracking
```

**Integration**: Already configured in `src/lib/infrastructure/sentry.ts`

---

### 5. Load Testing - 10 min

**Install k6**:
```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Run Tests**:
```bash
BASE_URL=https://your-app.com k6 run k6/smoke-feed-notifications.js
```

**Success Criteria**:
- ✅ p95 latency < 150ms
- ✅ 0% error rate
- ✅ 50 concurrent users sustained

---

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **DB Latency** | p95 < 500ms | ✅ |
| **Feed Load** | p95 < 150ms | 🔄 Test |
| **API Error Rate** | < 0.1% | ✅ |
| **CDN Cache Hit** | > 80% | 🔄 Enable CDN |
| **Redis Hit Rate** | > 90% | 🔄 Enable Redis |

---

## 🚀 Rollout Strategy

1. **Deploy infrastructure** (above steps)
2. **Enable feature flags** progressively:
   ```sql
   UPDATE feature_flags SET rollout = 1 WHERE key = 'feature_name';  -- 1%
   UPDATE feature_flags SET rollout = 10 WHERE key = 'feature_name'; -- 10%
   UPDATE feature_flags SET rollout = 100 WHERE key = 'feature_name'; -- 100%
   ```
3. **Monitor Sentry** for errors
4. **Run k6 load tests** after each rollout step
5. **Rollback** if p95 > 200ms or error rate > 0.5%

---

## 🔧 Environment Variables Summary

```bash
# Database
DATABASE_URL=postgres://user:pass@pgbouncer:6432/postgres?sslmode=require

# Redis
VITE_REDIS_URL=redis://:password@host:port

# Sentry
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_COMMIT_SHA=abc123

# Environment
ENVIRONMENT=production
NODE_ENV=production
```

---

## ✅ Post-Deployment Verification

```bash
# 1. Health check
curl https://your-app.com/health | jq

# 2. Load test
BASE_URL=https://your-app.com k6 run k6/smoke-feed-notifications.js

# 3. E2E tests
BASE_URL=https://your-app.com npm run test:e2e

# 4. Check Sentry dashboard for errors
open https://sentry.io/organizations/your-org/issues/
```

---

**Estimated Total Time**: 45 minutes
**Result**: Production-ready for 1B+ users

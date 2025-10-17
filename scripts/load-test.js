/**
 * k6 load test script for PR-I1 validation
 * Tests the 3 abuse scenarios: auth brute force, feed scraping, action spam
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const blockedRate = new Rate('rate_limited');
const cacheHitRate = new Rate('cache_hits');
const feedLatency = new Trend('feed_latency');

const API_URL = __ENV.API_URL || 'http://localhost:54321';
const DURATION = __ENV.K6_DURATION || '60s';
const VUS = parseInt(__ENV.K6_VUS || '100', 10);

export const options = {
  scenarios: {
    // Scenario 1: Auth brute force (should be blocked)
    auth_brute_force: {
      executor: 'constant-arrival-rate',
      rate: 30, // 30 requests per second
      duration: DURATION,
      preAllocatedVUs: 10,
      maxVUs: 20,
      exec: 'authBruteForce',
    },
    
    // Scenario 2: Feed scraping (should hit cache)
    feed_scraping: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      exec: 'feedScraping',
    },
    
    // Scenario 3: Action spam (should rate limit)
    action_spam: {
      executor: 'constant-arrival-rate',
      rate: 10, // 10 posts per second
      duration: DURATION,
      preAllocatedVUs: 5,
      maxVUs: 10,
      exec: 'actionSpam',
    },
  },
  
  thresholds: {
    'http_req_duration{scenario:feed_scraping}': ['p(95)<250'], // p95 < 250ms
    'rate_limited': ['rate>0.1'], // At least 10% should be blocked
    'cache_hits': ['rate>0.3'], // At least 30% cache hits
    'errors': ['rate<0.02'], // Less than 2% errors
  },
};

// Scenario 1: Auth brute force
export function authBruteForce() {
  const res = http.post(`${API_URL}/auth/v1/token`, {
    email: `test${Math.random()}@example.com`,
    password: 'wrongpassword',
  });
  
  const blocked = res.status === 429;
  blockedRate.add(blocked);
  errorRate.add(res.status >= 400);
  
  check(res, {
    'auth brute force blocked': (r) => r.status === 429 || r.status === 401,
  });
}

// Scenario 2: Feed scraping
export function feedScraping() {
  const profileId = 'test-profile-id';
  const lane = ['for_you', 'following', 'shop'][Math.floor(Math.random() * 3)];
  
  const startTime = Date.now();
  const res = http.post(`${API_URL}/rest/v1/rpc/feed_fusion_home`, 
    JSON.stringify({
      p_profile_id: profileId,
      p_lane: lane,
      p_cursor: null,
      p_limit: 20,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': __ENV.SUPABASE_ANON_KEY,
      },
    }
  );
  
  const duration = Date.now() - startTime;
  feedLatency.add(duration);
  
  // Check for cache hit (via custom header or fast response)
  const cacheHit = duration < 50 || res.headers['X-Cache-Status'] === 'HIT';
  cacheHitRate.add(cacheHit);
  errorRate.add(res.status >= 400);
  
  check(res, {
    'feed loaded': (r) => r.status === 200,
    'fast response': (r) => duration < 250,
  });
  
  sleep(0.1); // Brief pause between requests
}

// Scenario 3: Action spam
export function actionSpam() {
  const res = http.post(`${API_URL}/rest/v1/rpc/post_create`,
    JSON.stringify({
      p_body: `Spam post ${Date.now()}`,
      p_visibility: 'public',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': __ENV.SUPABASE_ANON_KEY,
      },
    }
  );
  
  const blocked = res.status === 429;
  blockedRate.add(blocked);
  errorRate.add(res.status >= 400 && res.status !== 429);
  
  check(res, {
    'rate limit enforced': (r) => r.status === 429 || r.status === 201,
  });
}

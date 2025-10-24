/**
 * Role: k6 load test for infinite scroll (10K concurrent users)
 * Path: yalls-inc/yalls-social/k6/load-scroll.js
 * Usage: k6 run yalls-inc/yalls-social/k6/load-scroll.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 1000 },   // Ramp to 1K
    { duration: '2m', target: 5000 },   // Ramp to 5K
    { duration: '2m', target: 10000 },  // Spike to 10K
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],   // 95% under 800ms
    http_req_failed: ['rate<0.02'],     // Less than 2% errors
  },
};

const BASE_URL = __ENV.VITE_SUPABASE_URL || 'http://localhost:54321';

export default function () {
  const userId = `user-${__VU}`;
  
  // Fetch feed (page 0)
  const page0 = http.get(
    `${BASE_URL}/rest/v1/yalls_social_posts?order=viral_score.desc&limit=20&offset=0`,
    {
      headers: { 'apikey': __ENV.VITE_SUPABASE_ANON_KEY },
    }
  );

  check(page0, {
    'feed page 0 loaded': (r) => r.status === 200,
    'feed has posts': (r) => JSON.parse(r.body).length > 0,
    'response time < 800ms': (r) => r.timings.duration < 800,
  });

  sleep(2);

  // Scroll and fetch page 1
  const page1 = http.get(
    `${BASE_URL}/rest/v1/yalls_social_posts?order=viral_score.desc&limit=20&offset=20`,
    {
      headers: { 'apikey': __ENV.VITE_SUPABASE_ANON_KEY },
    }
  );

  check(page1, {
    'feed page 1 loaded': (r) => r.status === 200,
  });

  sleep(3);

  // Like a post
  const likeRes = http.post(
    `${BASE_URL}/rest/v1/yalls_social_likes`,
    JSON.stringify({ post_id: 'post-1', user_id: userId }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': __ENV.VITE_SUPABASE_ANON_KEY,
      },
    }
  );

  check(likeRes, {
    'like post successful': (r) => r.status === 201 || r.status === 409, // 409 if already liked
  });

  sleep(1);
}

/**
 * Role: k6 load test for concurrent pinning (1K users)
 * Path: yalls-inc/yallbrary/k6/load-pin.js
 * Usage: k6 run yalls-inc/yallbrary/k6/load-pin.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 1000 },  // Spike to 1K users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

const BASE_URL = __ENV.VITE_SUPABASE_URL || 'http://localhost:54321';

export default function () {
  const userId = `user-${__VU}-${__ITER}`;
  const appId = 'yalls-social';

  // Pin app
  const pinRes = http.post(
    `${BASE_URL}/rest/v1/yallbrary_pins`,
    JSON.stringify({ user_id: userId, app_id: appId, position: 0 }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': __ENV.VITE_SUPABASE_ANON_KEY,
      },
    }
  );

  check(pinRes, {
    'pin status is 201': (r) => r.status === 201,
    'pin response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Fetch pinned apps
  const fetchRes = http.get(
    `${BASE_URL}/rest/v1/yallbrary_pins?user_id=eq.${userId}`,
    {
      headers: { 'apikey': __ENV.VITE_SUPABASE_ANON_KEY },
    }
  );

  check(fetchRes, {
    'fetch status is 200': (r) => r.status === 200,
    'fetch response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}

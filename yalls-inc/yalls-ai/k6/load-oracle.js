/**
 * Role: k6 load test for AI oracle (500 concurrent queries)
 * Path: yalls-inc/yalls-ai/k6/load-oracle.js
 * Run: k6 run k6/load-oracle.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp-up to 100 users
    { duration: '1m', target: 500 },  // Peak load: 500 concurrent queries
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],     // Less than 5% failure rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1';

export default function () {
  const roles = ['user', 'creator', 'business'];
  const role = roles[Math.floor(Math.random() * roles.length)];

  const capabilities = {
    user: ['suggest.follow', 'discover.content'],
    creator: ['monetize.ideas', 'audience.insights'],
    business: ['forecast.revenue', 'optimize.inventory'],
  };

  const capability = capabilities[role][Math.floor(Math.random() * capabilities[role].length)];

  const payload = JSON.stringify({
    role,
    action: capability,
    context: { userId: `user_${__VU}_${__ITER}` },
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(`${BASE_URL}/yalls-ai-query`, payload, params);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'has suggestion': (r) => JSON.parse(r.body).suggestion !== undefined,
    'response time OK': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}

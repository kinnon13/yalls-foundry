/**
 * Role: k6 load test for payment transactions (1K concurrent)
 * Path: yalls-inc/yallspay/k6/load-txn.js
 * Run: k6 run k6/load-txn.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 200 },  // Ramp-up to 200 users
    { duration: '1m', target: 1000 },  // Peak load: 1K concurrent transactions
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
    http_req_failed: ['rate<0.05'],     // Less than 5% failure rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1';

export default function () {
  const payload = JSON.stringify({
    userId: `user_${__VU}_${__ITER}`,
    amount: Math.floor(Math.random() * 1000) + 10, // Random amount $10-$1010
    productId: `prod_${Math.floor(Math.random() * 100)}`,
    gateway: Math.random() > 0.5 ? 'stripe' : 'venmo',
    uplineChain: [
      `upline1_${Math.floor(Math.random() * 50)}`,
      `upline2_${Math.floor(Math.random() * 50)}`,
      `upline3_${Math.floor(Math.random() * 50)}`,
    ],
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(`${BASE_URL}/yallspay-process-payment`, payload, params);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'has payment_id': (r) => JSON.parse(r.body).payment_id !== undefined,
    'response time OK': (r) => r.timings.duration < 3000,
  });

  sleep(1);
}

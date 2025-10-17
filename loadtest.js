/**
 * k6 Load Test Script
 * Tests feed performance under load
 * 
 * Run: k6 run loadtest.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 200 },   // Spike to 200 users
    { duration: '2m', target: 200 },   // Stay at 200 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],     // 95% of requests < 300ms
    http_req_failed: ['rate<0.02'],       // Error rate < 2%
    http_reqs: ['rate>100'],              // Throughput > 100 req/s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';

export default function () {
  // Test home feed
  const feedRes = http.get(`${BASE_URL}/`);
  check(feedRes, {
    'feed status 200': (r) => r.status === 200,
    'feed loads quickly': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test discover
  const discoverRes = http.get(`${BASE_URL}/discover`);
  check(discoverRes, {
    'discover status 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test dashboard
  const dashRes = http.get(`${BASE_URL}/dashboard`);
  check(dashRes, {
    'dashboard status 200': (r) => r.status === 200,
  });

  sleep(2);
}

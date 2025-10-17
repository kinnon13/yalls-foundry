/**
 * K6 Load Test: Feed + Notifications
 * Target: p95 < 150ms @ 50 VUs
 */

import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<150'],
    http_req_failed: ['rate==0'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health is 200': (r) => r.status === 200,
    'health has ok field': (r) => JSON.parse(r.body).ok === true,
  });

  // Feed endpoint
  const feedRes = http.get(`${BASE_URL}/api/feed?cursor=`);
  check(feedRes, {
    'feed is 200': (r) => r.status === 200,
  });

  // Notifications endpoint (requires auth, will 401 for anonymous)
  const notifRes = http.get(`${BASE_URL}/api/notifications`);
  check(notifRes, {
    'notifications responds': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}

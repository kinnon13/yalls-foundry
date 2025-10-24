/**
 * Role: k6 load test for navigation (500 concurrent clicks)
 * Path: k6/load-nav.js
 * Usage: k6 run k6/load-nav.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const apps = ['yallbrary', 'business', 'crm', 'marketplace', 'messages'];

export default function () {
  const randomApp = apps[Math.floor(Math.random() * apps.length)];
  
  const res = http.get(`${BASE_URL}/?app=${randomApp}`);
  
  check(res, {
    'nav status is 200': (r) => r.status === 200,
    'nav response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

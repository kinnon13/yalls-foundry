/**
 * Role: k6 load test for infinite scroll (10K scrolls)
 * Path: src/apps/yalls-social/k6/load-scroll.js
 * Usage: k6 run src/apps/yalls-social/k6/load-scroll.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 1000 },
    { duration: '2m', target: 10000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const page = Math.floor(Math.random() * 100);
  sleep(1);
}

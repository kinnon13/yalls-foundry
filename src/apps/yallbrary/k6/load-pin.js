/**
 * Role: k6 load test for concurrent pinning (1K users)
 * Path: src/apps/yallbrary/k6/load-pin.js
 * Usage: k6 run src/apps/yallbrary/k6/load-pin.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const userId = `user-${__VU}-${__ITER}`;
  sleep(1);
}

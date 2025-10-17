import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50, 
  duration: '2m',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<300'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:5173';

export default function () {
  let r = http.get(`${BASE}/`);
  check(r, { 'home 200': (res) => res.status === 200 });

  r = http.get(`${BASE}/discover`);
  check(r, { 'discover 200': (res) => res.status === 200 });

  r = http.get(`${BASE}/dashboard`);
  check(r, { 'dashboard 200': (res) => res.status === 200 });

  sleep(1);
}

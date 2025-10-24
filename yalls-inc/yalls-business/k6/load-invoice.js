/**
 * K6 Load Test: Business Invoice Creation
 * Simulates 1000 concurrent invoice creations, measures p95 latency
 * Run: k6 run --vus 50 --duration 30s load-invoice.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Ramp up to 50 VUs
    { duration: '20s', target: 50 }, // Sustain 50 VUs
    { duration: '10s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // <1% failure rate
  },
};

const BASE_URL = __ENV.API_URL || 'https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1';
const API_KEY = __ENV.SUPABASE_ANON_KEY || 'test-key';

export default function () {
  const businessId = `biz-${Math.floor(Math.random() * 100)}`;
  const contactId = `contact-${Math.floor(Math.random() * 1000)}`;
  const amount = Math.floor(Math.random() * 5000) + 100; // $100-$5000

  const payload = JSON.stringify({
    businessId,
    contactId,
    amount,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
  };

  const res = http.post(`${BASE_URL}/business-create-invoice`, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has invoice_id': (r) => JSON.parse(r.body).invoice_id !== undefined,
    'latency < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // 1 second pause between iterations
}

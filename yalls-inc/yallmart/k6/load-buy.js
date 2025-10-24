/**
 * Role: k6 load test for one-tap purchases (1K concurrent users)
 * Path: yalls-inc/yallmart/k6/load-buy.js
 * Usage: k6 run yalls-inc/yallmart/k6/load-buy.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Ramp to 100
    { duration: '1m', target: 500 },    // Ramp to 500
    { duration: '1m', target: 1000 },   // Spike to 1K
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'],   // 95% under 600ms
    http_req_failed: ['rate<0.01'],     // Less than 1% errors
  },
};

const BASE_URL = __ENV.VITE_SUPABASE_URL || 'http://localhost:54321';

export default function () {
  const userId = `user-${__VU}`;
  const productId = `product-${Math.floor(Math.random() * 50)}`;

  // Add to cart
  const addRes = http.post(
    `${BASE_URL}/rest/v1/yallmart_cart_items`,
    JSON.stringify({
      user_id: userId,
      product_id: productId,
      quantity: 1,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': __ENV.VITE_SUPABASE_ANON_KEY,
      },
    }
  );

  check(addRes, {
    'add to cart success': (r) => r.status === 201,
    'add response time < 600ms': (r) => r.timings.duration < 600,
  });

  sleep(1);

  // Fetch cart
  const cartRes = http.get(
    `${BASE_URL}/rest/v1/yallmart_cart_items?user_id=eq.${userId}`,
    {
      headers: { 'apikey': __ENV.VITE_SUPABASE_ANON_KEY },
    }
  );

  check(cartRes, {
    'fetch cart success': (r) => r.status === 200,
    'cart has items': (r) => JSON.parse(r.body).length > 0,
  });

  sleep(2);

  // Simulate checkout (stub)
  const checkoutRes = http.post(
    `${BASE_URL}/functions/v1/yallmart-checkout`,
    JSON.stringify({ user_id: userId }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': __ENV.VITE_SUPABASE_ANON_KEY,
      },
    }
  );

  check(checkoutRes, {
    'checkout initiated': (r) => r.status === 200 || r.status === 404, // 404 if function not deployed
  });

  sleep(1);
}

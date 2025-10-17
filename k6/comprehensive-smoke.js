import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Health check
  const health = http.get(`${BASE_URL}/functions/v1/health`);
  check(health, {
    'health 200': (r) => r.status === 200,
    'health fast': (r) => r.timings.duration < 500,
  });

  // Feed
  const feed = http.get(`${BASE_URL}/api/feed?cursor=`);
  check(feed, {
    'feed 200': (r) => r.status === 200,
  });

  // Notifications
  const notifs = http.get(`${BASE_URL}/api/notifications`);
  check(notifs, {
    'notifs accessible': (r) => [200, 401, 403].includes(r.status),
  });

  sleep(1);
}

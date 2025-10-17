import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: { 
    http_req_duration: ['p(95)<400'] 
  },
};

export default function () {
  const url = `${__ENV.APP_URL}/api/feed?cursor=`;
  http.get(url);
  sleep(1);
}

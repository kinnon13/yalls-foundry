import http from 'k6/http';

export const options = { 
  vus: 25, 
  duration: '45s', 
  thresholds: { 
    http_req_duration: ['p(95)<350'] 
  } 
};

export default function () {
  http.get(`${__ENV.APP_URL}/api/notifications/inbox`);
}

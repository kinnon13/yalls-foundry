/**
 * Demo Fixtures: Notifications (lanes: social, orders, events, crm, ai, system)
 */

import { generatePersonName, generateImage, generateTimestamp, createSeededRandom } from '../seed';

export type NotificationLane = 'social' | 'orders' | 'events' | 'crm' | 'ai' | 'system';

export interface DemoNotification {
  id: string;
  lane: NotificationLane;
  title: string;
  body: string;
  from?: {
    id: string;
    name: string;
    avatar: string;
  };
  created_at: string;
  read: boolean;
}

export function generateNotifications(count: number = 10): DemoNotification[] {
  const items: DemoNotification[] = [];
  const rng = createSeededRandom('notifications');
  const lanes: NotificationLane[] = ['social', 'orders', 'events', 'crm', 'ai', 'system'];
  
  for (let i = 0; i < count; i++) {
    const seed = `notif-${i}`;
    const lane = lanes[i % lanes.length];
    const person = generatePersonName(`person-${seed}`);
    
    let title = '';
    let body = '';
    
    switch (lane) {
      case 'social':
        title = `${person.full} liked your post`;
        body = 'Check out their profile';
        break;
      case 'orders':
        title = 'Order confirmed';
        body = `Your order #${i + 1000} is being processed`;
        break;
      case 'events':
        title = 'Event reminder';
        body = `Demo Event starts in 2 days`;
        break;
      case 'crm':
        title = 'New lead';
        body = `${person.full} viewed your listing`;
        break;
      case 'ai':
        title = 'AI insight';
        body = 'Your posts get 3x more engagement on Fridays';
        break;
      case 'system':
        title = 'System update';
        body = 'New features available';
        break;
    }
    
    items.push({
      id: `notif-${seed}`,
      lane,
      title,
      body,
      from: lane === 'social' || lane === 'crm' ? {
        id: `user-${seed}`,
        name: person.full,
        avatar: generateImage(`avatar-${seed}`, 200, 200),
      } : undefined,
      created_at: generateTimestamp(seed, 7),
      read: rng.next() < 0.4,
    });
  }
  
  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

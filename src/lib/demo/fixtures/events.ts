/**
 * Demo Fixtures: Events
 */

import { generatePersonName, generateImage, generateCity, generateTimestamp, createSeededRandom } from '../seed';

export interface DemoEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  organizer: {
    id: string;
    name: string;
    avatar: string;
  };
  media: { type: 'image'; url: string };
  stats: {
    rsvps: number;
  };
  status: 'upcoming' | 'past';
}

export function generateEvents(upcomingCount: number = 8, pastCount: number = 6): DemoEvent[] {
  const items: DemoEvent[] = [];
  const rng = createSeededRandom('events');
  const now = Date.now();
  
  // Upcoming events
  for (let i = 0; i < upcomingCount; i++) {
    const seed = `event-upcoming-${i}`;
    const organizer = generatePersonName(`org-${seed}`);
    const daysAhead = rng.int(1, 60);
    const starts = new Date(now + daysAhead * 24 * 60 * 60 * 1000);
    const ends = new Date(starts.getTime() + rng.int(2, 8) * 60 * 60 * 1000);
    
    items.push({
      id: `event-${seed}`,
      title: `Demo Event #${i + 1}`,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      location: `${generateCity(seed)} Arena`,
      organizer: {
        id: `org-${seed}`,
        name: organizer.full,
        avatar: generateImage(`avatar-${seed}`, 200, 200),
      },
      media: { type: 'image', url: generateImage(seed) },
      stats: {
        rsvps: rng.int(15, 300),
      },
      status: 'upcoming',
    });
  }
  
  // Past events
  for (let i = 0; i < pastCount; i++) {
    const seed = `event-past-${i}`;
    const organizer = generatePersonName(`org-${seed}`);
    const daysAgo = rng.int(1, 180);
    const starts = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const ends = new Date(starts.getTime() + rng.int(2, 8) * 60 * 60 * 1000);
    
    items.push({
      id: `event-${seed}`,
      title: `Past Event #${i + 1}`,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      location: `${generateCity(seed)} Grounds`,
      organizer: {
        id: `org-${seed}`,
        name: organizer.full,
        avatar: generateImage(`avatar-${seed}`, 200, 200),
      },
      media: { type: 'image', url: generateImage(seed) },
      stats: {
        rsvps: rng.int(50, 500),
      },
      status: 'past',
    });
  }
  
  return items;
}

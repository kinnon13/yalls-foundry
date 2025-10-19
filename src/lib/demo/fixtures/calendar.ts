/**
 * Demo Fixtures: Calendar Events (public widget + private dashboard)
 */

import { generatePersonName, generateCity, createSeededRandom } from '../seed';

export interface DemoCalendarEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  type: 'event' | 'reminder' | 'task';
}

export function generatePublicCalendarEvents(count: number = 7): DemoCalendarEvent[] {
  const items: DemoCalendarEvent[] = [];
  const rng = createSeededRandom('calendar-public');
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const seed = `cal-pub-${i}`;
    const daysAhead = rng.int(0, 30);
    const starts = new Date(now + daysAhead * 24 * 60 * 60 * 1000);
    const ends = new Date(starts.getTime() + rng.int(1, 6) * 60 * 60 * 1000);
    
    items.push({
      id: `cal-${seed}`,
      title: `Public Event #${i + 1}`,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      location: `${generateCity(seed)} Arena`,
      type: 'event',
    });
  }
  
  return items.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

export function generatePrivateCalendarEvents(count: number = 7): DemoCalendarEvent[] {
  const items: DemoCalendarEvent[] = [];
  const rng = createSeededRandom('calendar-private');
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const seed = `cal-priv-${i}`;
    const daysAhead = rng.int(0, 30);
    const starts = new Date(now + daysAhead * 24 * 60 * 60 * 1000);
    const ends = new Date(starts.getTime() + rng.int(1, 4) * 60 * 60 * 1000);
    const type = rng.pick<DemoCalendarEvent['type']>(['event', 'reminder', 'task']);
    
    items.push({
      id: `cal-${seed}`,
      title: type === 'task' ? `Task: Demo #${i + 1}` : `Private ${type} #${i + 1}`,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      location: type === 'task' ? '' : `${generateCity(seed)}`,
      type,
    });
  }
  
  return items.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
}

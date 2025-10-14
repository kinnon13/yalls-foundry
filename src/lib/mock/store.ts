/**
 * Mock Data Store (in-memory)
 * 
 * Provides deterministic mock data generation for testing and development.
 * Data is stable within a session to avoid confusion during debugging.
 */

import { generateULID } from '@/lib/utils/ulid';

interface MockProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

interface MockEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MockStore {
  profiles: MockProfile[];
  events: MockEvent[];
}

// Session seed for deterministic IDs (set once per page load)
const SESSION_SEED = Date.now();
let idCounter = 0;

const store: MockStore = {
  profiles: [],
  events: [],
};

/**
 * Generate a deterministic ID for this session
 */
function generateSessionId(): string {
  return `mock_${SESSION_SEED}_${idCounter++}`;
}

/**
 * Seed mock profiles
 */
export function seedProfiles(count: number): void {
  const now = new Date().toISOString();
  const names = ['Alex Rivera', 'Sam Chen', 'Jordan Taylor', 'Casey Morgan', 'Riley Quinn',
                 'Drew Parker', 'Avery Brooks', 'Cameron Lee', 'Skyler Jones', 'Morgan Davis'];
  
  for (let i = 0; i < count; i++) {
    const id = generateSessionId();
    const name = names[i % names.length];
    
    store.profiles.push({
      id,
      user_id: id,
      display_name: name,
      bio: `Mock bio for ${name}. This is test data.`,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      created_at: now,
      updated_at: now,
    });
  }
}

/**
 * Seed mock events
 */
export function seedEvents(count: number): void {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const types = ['concert', 'meetup', 'workshop', 'conference', 'party'];
  const titles = ['Community Meetup', 'Tech Workshop', 'Music Festival', 'Networking Event', 'Art Exhibition'];
  
  for (let i = 0; i < count; i++) {
    const id = generateSessionId();
    const title = titles[i % titles.length];
    
    store.events.push({
      id,
      title: `${title} #${i + 1}`,
      slug: `event-${id}`,
      description: `Mock event description for ${title}. This is test data.`,
      event_type: types[i % types.length],
      starts_at: tomorrow,
      ends_at: new Date(Date.now() + 172800000).toISOString(),
      created_by: generateSessionId(),
      created_at: now,
      updated_at: now,
    });
  }
}

/**
 * Clear all mock data
 */
export function clearAll(): void {
  store.profiles = [];
  store.events = [];
  idCounter = 0;
}

/**
 * Get counts of mock data
 */
export function counts(): { profiles: number; events: number } {
  return {
    profiles: store.profiles.length,
    events: store.events.length,
  };
}

/**
 * Get all profiles (for display/testing)
 */
export function getProfiles(): MockProfile[] {
  return [...store.profiles];
}

/**
 * Get all events (for display/testing)
 */
export function getEvents(): MockEvent[] {
  return [...store.events];
}

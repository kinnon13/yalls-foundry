/**
 * Deterministic Seeding for Demo Mode
 * Uses a seed (userId or 'guest') to generate stable names/media
 */

const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Dakota', 'Avery', 'Quinn'];
const LAST_NAMES = ['Rivera', 'Chen', 'Parker', 'Brooks', 'Hayes', 'Stone', 'Wells', 'Cruz', 'Reed', 'Fox'];

const HORSE_NAMES = ['Thunder', 'Storm', 'Blaze', 'Spirit', 'Midnight', 'Ranger', 'Dusty', 'Star', 'Shadow', 'Flash'];
const FARM_NAMES = ['Sunny Acres', 'Oak Ridge', 'Pine Valley', 'River Bend', 'Mountain View', 'Green Meadows', 'Wild Rose', 'Silver Creek', 'Golden Hills', 'Blue Sky'];

const CITIES = ['Austin', 'Nashville', 'Denver', 'Phoenix', 'Dallas', 'Fort Worth', 'Oklahoma City', 'San Antonio', 'Houston', 'Tulsa'];

/**
 * Simple hash for deterministic randomness
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed: string) {
    this.seed = simpleHash(seed);
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

export function createSeededRandom(seed: string = 'guest'): SeededRandom {
  return new SeededRandom(seed);
}

export function generatePersonName(seed: string): { first: string; last: string; full: string } {
  const rng = createSeededRandom(seed);
  const first = rng.pick(FIRST_NAMES);
  const last = rng.pick(LAST_NAMES);
  return { first, last, full: `${first} ${last}` };
}

export function generateHorseName(seed: string): string {
  const rng = createSeededRandom(seed);
  return rng.pick(HORSE_NAMES);
}

export function generateFarmName(seed: string): string {
  const rng = createSeededRandom(seed);
  return rng.pick(FARM_NAMES);
}

export function generateCity(seed: string): string {
  const rng = createSeededRandom(seed);
  return rng.pick(CITIES);
}

/**
 * Generate 9:16 image URL (picsum)
 */
export function generateImage(seed: string, width = 720, height = 1280): string {
  const id = simpleHash(seed) % 1000;
  return `https://picsum.photos/seed/${id}/${width}/${height}`;
}

/**
 * Generate video URL (loop 2 demo mp4s)
 */
export function generateVideo(seed: string): string {
  const id = simpleHash(seed) % 2;
  return `/demo/video-${id}.mp4`;
}

/**
 * Generate counts (stable per seed)
 */
export function generateCounts(seed: string) {
  const rng = createSeededRandom(seed);
  return {
    followers: rng.int(50, 5000),
    following: rng.int(20, 500),
    likes: rng.int(100, 10000),
    comments: rng.int(5, 200),
    reposts: rng.int(2, 100),
    views: rng.int(500, 50000),
  };
}

/**
 * Generate timestamp (recent past)
 */
export function generateTimestamp(seed: string, daysAgo: number = 7): string {
  const rng = createSeededRandom(seed);
  const now = Date.now();
  const offset = rng.int(0, daysAgo * 24 * 60 * 60 * 1000);
  return new Date(now - offset).toISOString();
}

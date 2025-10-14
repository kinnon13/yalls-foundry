/**
 * ULID Generator
 * 
 * Universally Unique Lexicographically Sortable Identifiers.
 * Alternative to UUID with better sorting properties.
 * 
 * Usage:
 *   import { generateULID } from '@/lib/utils/ulid';
 *   const id = generateULID();
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/**
 * Generate ULID
 */
export function generateULID(seedTime?: number): string {
  const time = seedTime || Date.now();
  const timeStr = encodeTime(time);
  const randomStr = encodeRandom();
  
  return timeStr + randomStr;
}

/**
 * Encode timestamp as base32
 */
function encodeTime(time: number): string {
  let str = '';
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    const mod = time % ENCODING_LEN;
    str = ENCODING[mod] + str;
    time = (time - mod) / ENCODING_LEN;
  }
  return str;
}

/**
 * Encode random component as base32
 */
function encodeRandom(): string {
  let str = '';
  const randomBytes = new Uint8Array(RANDOM_LEN);
  crypto.getRandomValues(randomBytes);
  
  for (let i = 0; i < RANDOM_LEN; i++) {
    str += ENCODING[randomBytes[i] % ENCODING_LEN];
  }
  
  return str;
}

/**
 * Extract timestamp from ULID
 */
export function ulidToTimestamp(ulid: string): number {
  let time = 0;
  const timeStr = ulid.substring(0, TIME_LEN);
  
  for (let i = 0; i < TIME_LEN; i++) {
    const char = timeStr[i];
    const index = ENCODING.indexOf(char);
    time = time * ENCODING_LEN + index;
  }
  
  return time;
}
import { ProfilePin, ProfilePinsPort } from '@/ports/profilePins';

const KEY = 'mock:pins';

function read(): Record<string, ProfilePin[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(db: Record<string, ProfilePin[]>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const profilePinsMock: ProfilePinsPort = {
  async list(userId) {
    const db = read();
    return (db[userId] || []).sort((a, b) => a.position - b.position);
  },

  async set(userId, pins) {
    const db = read();
    db[userId] = pins.map((p, i) => ({
      ...p,
      id: crypto.randomUUID(),
      user_id: userId,
      position: i + 1,
      created_at: new Date().toISOString(),
    }));
    write(db);
  },

  async add(userId, pin) {
    const db = read();
    const pins = db[userId] || [];
    const next: ProfilePin = {
      ...pin,
      id: crypto.randomUUID(),
      user_id: userId,
      position: pins.length + 1,
      created_at: new Date().toISOString(),
    };
    db[userId] = [...pins, next];
    write(db);
    return next;
  },

  async remove(userId, pinId) {
    const db = read();
    db[userId] = (db[userId] || []).filter(p => p.id !== pinId).map((p, i) => ({ ...p, position: i + 1 }));
    write(db);
  },

  async reorder(userId, orderedIds) {
    const db = read();
    const byId = new Map((db[userId] || []).map(p => [p.id, p]));
    db[userId] = orderedIds.map((id, i) => ({ ...byId.get(id)!, position: i + 1 }));
    write(db);
  },
};

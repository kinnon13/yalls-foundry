import { Repost, RepostsPort } from '@/ports/reposts';

const KEY = 'mock:reposts';

function read(): Record<string, Repost[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(db: Record<string, Repost[]>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const repostsMock: RepostsPort = {
  async create(source_post_id, caption, targets) {
    const db = read();
    const userId = 'mock-user';
    const reposts = db[userId] || [];
    
    // Check for existing plain repost (idempotency simulation)
    if (!caption && !targets) {
      const existing = reposts.find(r => r.source_post_id === source_post_id);
      if (existing) {
        return { new_post_id: existing.new_post_id, status: 'existing' };
      }
    }
    
    const newRepost: Repost = {
      id: crypto.randomUUID(),
      source_post_id,
      by_entity_id: 'mock-entity',
      new_post_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    
    db[userId] = [newRepost, ...reposts];
    write(db);
    
    return { new_post_id: newRepost.new_post_id, status: 'inserted' };
  },

  async list(userId) {
    const db = read();
    return db[userId] || [];
  },
};

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
    
    const newRepost: Repost = {
      id: crypto.randomUUID(),
      source_post_id,
      by_entity_id: 'mock-entity',
      new_post_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    
    db[userId] = [newRepost, ...reposts];
    write(db);
    
    return { new_post_id: newRepost.new_post_id };
  },

  async list(userId) {
    const db = read();
    return db[userId] || [];
  },
};

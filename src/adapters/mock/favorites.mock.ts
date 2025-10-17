import { Favorite, FavoritesPort, FavoriteType } from '@/ports/favorites';

const KEY = 'mock:favorites';

function read(): Record<string, Favorite[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(db: Record<string, Favorite[]>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const favoritesMock: FavoritesPort = {
  async toggle(userId, fav_type, ref_id) {
    const db = read();
    const favs = db[userId] || [];
    const idx = favs.findIndex(f => f.fav_type === fav_type && f.ref_id === ref_id);

    if (idx >= 0) {
      favs.splice(idx, 1);
      db[userId] = favs;
      write(db);
      return { is_favorited: false };
    }

    const newFav: Favorite = {
      id: crypto.randomUUID(),
      user_id: userId,
      fav_type,
      ref_id,
      created_at: new Date().toISOString(),
    };
    db[userId] = [newFav, ...favs];
    write(db);
    return { is_favorited: true };
  },

  async list(userId, fav_type?) {
    const db = read();
    const favs = db[userId] || [];
    return fav_type ? favs.filter(f => f.fav_type === fav_type) : favs;
  },

  async check(userId, items) {
    const db = read();
    const favs = db[userId] || [];
    const favSet = new Set(favs.map(f => `${f.fav_type}:${f.ref_id}`));
    return items.map(item => ({
      ref_id: item.ref_id,
      is_favorited: favSet.has(`${item.fav_type}:${item.ref_id}`),
    }));
  },
};

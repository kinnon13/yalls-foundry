const k = (ns: string, id: string) => `${ns}:${id}`;
const get = <T>(key: string, def: T) => {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return def; }
};
const set = (key: string, v: unknown) => localStorage.setItem(key, JSON.stringify(v));

export type PinType = 'post' | 'event' | 'horse' | 'earning' | 'link' | 'achievement';
export interface Pin {
  id: string;
  user_id: string;
  pin_type: PinType;
  ref_id: string;
  position: number;
  title?: string;
  metadata?: any;
  created_at: string;
}

export async function pins_get(userId: string): Promise<Pin[]> {
  return get<Pin[]>(k('pins', userId), []);
}

export async function pins_set(userId: string, pins: Pin[]): Promise<void> {
  set(k('pins', userId), pins.slice(0, 8).map((p, i) => ({ ...p, position: i + 1 })));
}

export async function favorite_toggle(userId: string, fav_type: string, ref_id: string) {
  const arr = get<{ fav_type: string; ref_id: string; created_at: string }[]>(k('favs', userId), []);
  const idx = arr.findIndex(f => f.fav_type === fav_type && f.ref_id === ref_id);
  if (idx >= 0) {
    arr.splice(idx, 1);
    set(k('favs', userId), arr);
    return { is_favorited: false };
  }
  arr.unshift({ fav_type, ref_id, created_at: new Date().toISOString() });
  set(k('favs', userId), arr);
  return { is_favorited: true };
}

export async function favorites_list(userId: string, fav_type?: string) {
  const arr = get<{ fav_type: string; ref_id: string; created_at: string }[]>(k('favs', userId), []);
  return fav_type ? arr.filter(f => f.fav_type === fav_type) : arr;
}

export async function repost_create(userId: string, source_post_id: string, caption?: string, targets?: string[]) {
  const arr = get<any[]>(k('reposts', userId), []);
  const id = crypto.randomUUID();
  arr.unshift({ id, userId, source_post_id, caption, targets, created_at: new Date().toISOString() });
  set(k('reposts', userId), arr);
  return { new_post_id: id };
}

export async function linked_upsert(userId: string, provider: string, handle: string, proof_url?: string) {
  const arr = get<any[]>(k('linked', userId), []);
  const existing = arr.find(a => a.provider === provider);
  if (existing) {
    Object.assign(existing, { handle, proof_url, verified: false });
  } else {
    arr.push({
      id: crypto.randomUUID(),
      userId,
      provider,
      handle,
      proof_url: proof_url || null,
      verified: false,
      linked_at: new Date().toISOString(),
    });
  }
  set(k('linked', userId), arr);
  return { ok: true };
}

export async function linked_list(userId: string) {
  return get<any[]>(k('linked', userId), []);
}

export async function edges_list(entity_id: string) {
  return get<any[]>(k('edges', entity_id), []);
}

export async function edges_set(entity_id: string, edges: any[]) {
  set(k('edges', entity_id), edges);
  return { ok: true };
}

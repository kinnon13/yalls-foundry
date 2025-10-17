export type PinType = 'post' | 'event' | 'horse' | 'earning' | 'link' | 'achievement';

export interface ProfilePin {
  id: string;
  user_id: string;
  pin_type: PinType;
  ref_id: string;
  position: number;
  title?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface ProfilePinsPort {
  list(userId: string): Promise<ProfilePin[]>;
  set(userId: string, pins: Omit<ProfilePin, 'id' | 'user_id' | 'created_at'>[]): Promise<void>;
  add(userId: string, pin: Omit<ProfilePin, 'id' | 'position' | 'user_id' | 'created_at'>): Promise<ProfilePin>;
  remove(userId: string, pinId: string): Promise<void>;
  reorder(userId: string, orderedIds: string[]): Promise<void>;
}

/**
 * Mock Profile Service
 * 
 * In-memory profile CRUD for development.
 * Swap for Supabase service when ready.
 */

import type { AnyProfile, ProfileType } from './types';

class MockProfileService {
  private profiles: Map<string, AnyProfile> = new Map();
  private idCounter = 1;
  
  constructor() {
    // Seed with sample data
    this.seedData();
  }
  
  async getById(id: string): Promise<AnyProfile | null> {
    return this.profiles.get(id) ?? null;
  }
  
  async list(type?: ProfileType): Promise<AnyProfile[]> {
    const all = Array.from(this.profiles.values());
    return type ? all.filter(p => p.type === type) : all;
  }
  
  async create(data: Partial<AnyProfile>): Promise<AnyProfile> {
    const id = `profile_${this.idCounter++}`;
    const now = new Date().toISOString();
    
    const profile: AnyProfile = {
      id,
      name: data.name ?? 'Untitled',
      type: data.type ?? 'horse',
      is_claimed: false,
      created_at: now,
      updated_at: now,
      ...data,
    } as AnyProfile;
    
    this.profiles.set(id, profile);
    return profile;
  }
  
  async update(id: string, data: Partial<AnyProfile>): Promise<AnyProfile | null> {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    
    const updated: AnyProfile = {
      ...profile,
      ...data,
      id, // Never change ID
      updated_at: new Date().toISOString(),
    } as AnyProfile;
    
    this.profiles.set(id, updated);
    return updated;
  }
  
  async claim(id: string, userId: string): Promise<AnyProfile | null> {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    
    const updated: AnyProfile = {
      ...profile,
      is_claimed: true,
      claimed_by: userId,
      updated_at: new Date().toISOString(),
    };
    
    this.profiles.set(id, updated);
    return updated;
  }
  
  async delete(id: string): Promise<boolean> {
    return this.profiles.delete(id);
  }
  
  private seedData(): void {
    const now = new Date().toISOString();
    
    this.profiles.set('horse_1', {
      id: 'horse_1',
      type: 'horse',
      name: 'Thunder',
      breed: 'Thoroughbred',
      dob: '2018-05-15',
      sex: 'M',
      is_claimed: false,
      created_at: now,
      updated_at: now,
    });
    
    this.profiles.set('farm_1', {
      id: 'farm_1',
      type: 'farm',
      name: 'Sunny Acres',
      city: 'Austin',
      state: 'TX',
      is_claimed: true,
      claimed_by: 'user_123',
      created_at: now,
      updated_at: now,
    });
    
    this.idCounter = 3;
  }
}

export const mockProfileService = new MockProfileService();

/**
 * Profile Types
 * 
 * Unified profile system supporting multiple entity types.
 */

export type ProfileType =
  | 'horse'
  | 'farm'
  | 'business'
  | 'animal'
  | 'rider'
  | 'owner'
  | 'breeder';

export interface BaseProfile {
  id: string;
  type: ProfileType;
  name: string;
  is_claimed: boolean;
  claimed_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Horse extends BaseProfile {
  type: 'horse';
  breed?: string;
  dob?: string;
  sex?: 'M' | 'F';
}

export interface Farm extends BaseProfile {
  type: 'farm';
  city?: string;
  state?: string;
}

export interface Business extends BaseProfile {
  type: 'business';
  industry?: string;
  website?: string;
}

export interface Animal extends BaseProfile {
  type: 'animal';
  species?: string;
  breed?: string;
}

export interface Rider extends BaseProfile {
  type: 'rider';
  discipline?: string;
  level?: string;
}

export interface Owner extends BaseProfile {
  type: 'owner';
  location?: string;
}

export interface Breeder extends BaseProfile {
  type: 'breeder';
  specialization?: string;
}

export type AnyProfile = Horse | Farm | Business | Animal | Rider | Owner | Breeder;

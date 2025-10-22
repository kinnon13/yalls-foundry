/**
 * Role Management
 * Dev override via ?role= query param for local testing
 */

import type { Role } from '@/apps/types';

let cached: Role | null = null;

export function getCurrentRole(): Role {
  if (cached) return cached;

  // Dev/test override via ?role= query param
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search);
    const r = (sp.get('role') || '').toLowerCase();
    if (r === 'anonymous' || r === 'user' || r === 'admin' || r === 'super') {
      cached = r as Role;
      return cached;
    }
  }

  // TODO: replace with real auth role (Supabase/session)
  cached = 'user';
  return cached;
}

/** Helper for tests to reset role cache between navigations */
export function __resetRoleCache() { 
  cached = null; 
}

/** Role hierarchy rank for permission checks */
export function rank(r: Role): number {
  return r === 'anonymous' ? 0 : r === 'user' ? 1 : r === 'admin' ? 2 : 3;
}

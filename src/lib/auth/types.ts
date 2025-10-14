/**
 * Auth Types
 * 
 * Core authentication types used across the auth system.
 */

import type { Role } from './rbac';

export type Session = {
  userId: string;
  email: string;
  role: Role;
} | null;

export type AuthChangeCallback = (session: Session) => void;

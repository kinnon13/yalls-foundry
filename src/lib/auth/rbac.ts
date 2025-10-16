/**
 * Role-Based Access Control (RBAC)
 * 
 * Defines roles, actions, subjects, and permission matrix.
 */

export type Role =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'business_owner'
  | 'rider'
  | 'breeder'
  | 'owner'
  | 'guest';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'claim';

export type Subject = 'profile' | 'profile.claim' | 'admin.area';

/**
 * Permission matrix
 * Defines which actions each role can perform on each subject
 */
const matrix: Record<Role, Partial<Record<Subject, Action[]>>> = {
  super_admin: {
    'admin.area': ['read', 'create', 'update', 'delete'],
    profile: ['read', 'create', 'update', 'delete'],
    'profile.claim': ['claim'],
  },
  admin: {
    'admin.area': ['read', 'update', 'delete'],
    profile: ['read', 'create', 'update', 'delete'],
    'profile.claim': ['claim'],
  },
  moderator: {
    'admin.area': ['read'],
    profile: ['read', 'update'],
    'profile.claim': ['claim'],
  },
  business_owner: {
    profile: ['read', 'update'],
    'profile.claim': ['claim'],
  },
  rider: {
    profile: ['read', 'update'],
  },
  breeder: {
    profile: ['read', 'update'],
  },
  owner: {
    profile: ['read', 'update'],
  },
  guest: {
    profile: ['read'],
  },
};

/**
 * Check if a role can perform an action on a subject
 */
export function can(role: Role, action: Action, subject: Subject): boolean {
  return !!matrix[role]?.[subject]?.includes(action);
}

/**
 * Get all actions a role can perform on a subject
 */
export function getActions(role: Role, subject: Subject): Action[] {
  return matrix[role]?.[subject] ?? [];
}

/**
 * Check if a role has any permissions on a subject
 */
export function hasAccess(role: Role, subject: Subject): boolean {
  return !!(matrix[role]?.[subject]?.length ?? 0);
}

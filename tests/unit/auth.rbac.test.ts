/**
 * Unit Tests: RBAC
 */

import { describe, it, expect } from 'vitest';
import { can, getActions, hasAccess, type Role, type Action, type Subject } from '@/lib/auth/rbac';

describe('RBAC', () => {
  describe('can()', () => {
    it('should allow admin full access to admin area', () => {
      expect(can('admin', 'read', 'admin.area')).toBe(true);
      expect(can('admin', 'update', 'admin.area')).toBe(true);
      expect(can('admin', 'delete', 'admin.area')).toBe(true);
    });

    it('should allow moderator read-only access to admin area', () => {
      expect(can('moderator', 'read', 'admin.area')).toBe(true);
      expect(can('moderator', 'update', 'admin.area')).toBe(false);
      expect(can('moderator', 'delete', 'admin.area')).toBe(false);
    });

    it('should deny guest access to admin area', () => {
      expect(can('guest', 'read', 'admin.area')).toBe(false);
    });

    it('should allow admin to claim profiles', () => {
      expect(can('admin', 'claim', 'profile.claim')).toBe(true);
    });

    it('should allow business_owner to claim profiles', () => {
      expect(can('business_owner', 'claim', 'profile.claim')).toBe(true);
    });

    it('should deny rider from claiming profiles', () => {
      expect(can('rider', 'claim', 'profile.claim')).toBe(false);
    });

    it('should allow all roles to read profiles', () => {
      const roles: Role[] = ['admin', 'moderator', 'business_owner', 'rider', 'breeder', 'owner', 'guest'];
      roles.forEach(role => {
        expect(can(role, 'read', 'profile')).toBe(true);
      });
    });

    it('should deny guest from updating profiles', () => {
      expect(can('guest', 'update', 'profile')).toBe(false);
    });
  });

  describe('getActions()', () => {
    it('should return all actions admin can perform on admin area', () => {
      const actions = getActions('admin', 'admin.area');
      expect(actions).toContain('read');
      expect(actions).toContain('update');
      expect(actions).toContain('delete');
    });

    it('should return empty array for guest on admin area', () => {
      const actions = getActions('guest', 'admin.area');
      expect(actions).toEqual([]);
    });
  });

  describe('hasAccess()', () => {
    it('should return true if role has any permissions on subject', () => {
      expect(hasAccess('admin', 'admin.area')).toBe(true);
      expect(hasAccess('moderator', 'admin.area')).toBe(true);
    });

    it('should return false if role has no permissions on subject', () => {
      expect(hasAccess('guest', 'admin.area')).toBe(false);
      expect(hasAccess('rider', 'profile.claim')).toBe(false);
    });
  });
});

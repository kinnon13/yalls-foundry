/**
 * Unit Tests: Profile Service (Mock)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockProfileService } from '@/lib/profiles/service.mock';

describe('Mock Profile Service', () => {
  beforeEach(async () => {
    // Clear and reseed before each test
    const all = await mockProfileService.list();
    for (const p of all) {
      await mockProfileService.delete(p.id);
    }
  });

  describe('getById', () => {
    it('should return profile by ID', async () => {
      const created = await mockProfileService.create({ name: 'Test Horse', type: 'horse' });
      const fetched = await mockProfileService.getById(created.id);

      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.name).toBe('Test Horse');
    });

    it('should return null for non-existent ID', async () => {
      const fetched = await mockProfileService.getById('nonexistent');
      expect(fetched).toBeNull();
    });
  });

  describe('list', () => {
    it('should return all profiles when no type specified', async () => {
      await mockProfileService.create({ name: 'Horse 1', type: 'horse' });
      await mockProfileService.create({ name: 'Farm 1', type: 'farm' });

      const all = await mockProfileService.list();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by type', async () => {
      await mockProfileService.create({ name: 'Horse 1', type: 'horse' });
      await mockProfileService.create({ name: 'Farm 1', type: 'farm' });

      const horses = await mockProfileService.list('horse');
      expect(horses.length).toBeGreaterThan(0);
      expect(horses.every(p => p.type === 'horse')).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a new profile with defaults', async () => {
      const profile = await mockProfileService.create({ name: 'New Horse', type: 'horse' });

      expect(profile.id).toBeDefined();
      expect(profile.name).toBe('New Horse');
      expect(profile.type).toBe('horse');
      expect(profile.is_claimed).toBe(false);
      expect(profile.created_at).toBeDefined();
      expect(profile.updated_at).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update existing profile', async () => {
      const created = await mockProfileService.create({ name: 'Old Name', type: 'horse' });
      const updated = await mockProfileService.update(created.id, { name: 'New Name' });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('New Name');
      expect(updated?.id).toBe(created.id);
    });

    it('should return null for non-existent profile', async () => {
      const updated = await mockProfileService.update('nonexistent', { name: 'Test' });
      expect(updated).toBeNull();
    });
  });

  describe('claim', () => {
    it('should claim unclaimed profile', async () => {
      const created = await mockProfileService.create({ name: 'Unclaimed', type: 'horse' });
      const claimed = await mockProfileService.claim(created.id, 'user123');

      expect(claimed).not.toBeNull();
      expect(claimed?.is_claimed).toBe(true);
      expect(claimed?.claimed_by).toBe('user123');
    });

    it('should return null for non-existent profile', async () => {
      const claimed = await mockProfileService.claim('nonexistent', 'user123');
      expect(claimed).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing profile', async () => {
      const created = await mockProfileService.create({ name: 'To Delete', type: 'horse' });
      const deleted = await mockProfileService.delete(created.id);

      expect(deleted).toBe(true);

      const fetched = await mockProfileService.getById(created.id);
      expect(fetched).toBeNull();
    });

    it('should return false for non-existent profile', async () => {
      const deleted = await mockProfileService.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });
});

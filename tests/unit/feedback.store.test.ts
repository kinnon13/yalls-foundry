/**
 * Unit Tests: Feedback Store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addFeedback, listFeedback, clearFeedback, markStatus } from '@/lib/feedback/store';

describe('Feedback Store', () => {
  beforeEach(() => { vi.useFakeTimers(); clearFeedback(); });
  afterEach(() => { vi.useRealTimers(); });

  describe('addFeedback()', () => {
    it('should add and list feedback', () => {
      addFeedback({ 
        path: '/test', 
        message: 'This is broken', 
        severity: 'bug', 
        userAgent: 'test-ua' 
      });
      
      const items = listFeedback();
      expect(items.length).toBe(1);
      expect(items[0].message).toBe('This is broken');
      expect(items[0].status).toBe('new');
      expect(items[0].path).toBe('/test');
    });

    it('should include optional fields', () => {
      addFeedback({
        path: '/profile',
        message: 'Confusing flow',
        severity: 'confusing',
        email: 'user@test.com',
        role: 'admin',
      });

      const items = listFeedback();
      expect(items[0].email).toBe('user@test.com');
      expect(items[0].role).toBe('admin');
    });

    it('should generate unique IDs and timestamps', () => {
      addFeedback({ path: '/', message: 'First', severity: 'bug' });
      addFeedback({ path: '/', message: 'Second', severity: 'idea' });

      const items = listFeedback();
      expect(items.length).toBe(2);
      expect(items[0].id).not.toBe(items[1].id);
      expect(items[0].ts).toBeDefined();
      expect(items[1].ts).toBeDefined();
    });
  });

  describe('markStatus()', () => {
    it('should update status of existing feedback', () => {
      const { id } = addFeedback({
        path: '/',
        message: 'Confusing step',
        severity: 'confusing',
      });

      const updated = markStatus(id, 'triaged');
      expect(updated?.status).toBe('triaged');
      expect(updated?.id).toBe(id);

      const items = listFeedback();
      expect(items[0].status).toBe('triaged');
    });

    it('should return null for non-existent ID', () => {
      const result = markStatus('nonexistent-id', 'closed');
      expect(result).toBeNull();
    });

    it('should handle status transitions', () => {
      const { id } = addFeedback({ path: '/', message: 'Test', severity: 'bug' });

      markStatus(id, 'triaged');
      expect(listFeedback()[0].status).toBe('triaged');

      markStatus(id, 'closed');
      expect(listFeedback()[0].status).toBe('closed');
    });
  });

  describe('clearFeedback()', () => {
    it('should remove all feedback items', () => {
      addFeedback({ path: '/', message: 'First', severity: 'bug' });
      addFeedback({ path: '/', message: 'Second', severity: 'idea' });

      expect(listFeedback().length).toBe(2);

      clearFeedback();
      expect(listFeedback().length).toBe(0);
    });
  });

  describe('listFeedback()', () => {
    it('should return items sorted by timestamp descending', () => {
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      addFeedback({ path: '/', message: 'First', severity: 'bug' });
      vi.setSystemTime(new Date('2024-01-01T00:00:01Z'));
      addFeedback({ path: '/', message: 'Second', severity: 'idea' });
      
      const items = listFeedback();
      expect(items[0].message).toBe('Second');
      expect(items[1].message).toBe('First');
    });
  });
});

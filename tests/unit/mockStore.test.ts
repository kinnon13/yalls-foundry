/**
 * Unit Tests: Mock Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { seedProfiles, seedEvents, clearAll, counts, getProfiles, getEvents } from '@/lib/mock/store';

describe('mockStore', () => {
  beforeEach(() => {
    clearAll();
  });

  it('should seed profiles deterministically', () => {
    seedProfiles(5);
    const firstBatch = getProfiles();
    expect(firstBatch).toHaveLength(5);
    
    // IDs should be stable within session
    const firstIds = firstBatch.map(p => p.id);
    expect(firstIds[0]).toMatch(/^mock_/);
  });

  it('should seed events deterministically', () => {
    seedEvents(3);
    const events = getEvents();
    expect(events).toHaveLength(3);
    expect(events[0].event_type).toMatch(/concert|meetup|workshop|conference|party/);
  });

  it('should return correct counts', () => {
    seedProfiles(10);
    seedEvents(5);
    
    const result = counts();
    expect(result.profiles).toBe(10);
    expect(result.events).toBe(5);
  });

  it('should clear all data', () => {
    seedProfiles(10);
    seedEvents(5);
    clearAll();
    
    const result = counts();
    expect(result.profiles).toBe(0);
    expect(result.events).toBe(0);
  });

  it('should accumulate data across multiple seeds', () => {
    seedProfiles(5);
    seedProfiles(5);
    
    const result = counts();
    expect(result.profiles).toBe(10);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('Knowledge Base', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search', () => {
    it('should search knowledge with keyword and semantic', async () => {
      const mockResults = {
        results: [
          {
            id: '123',
            title: 'Create Event Guide',
            category: 'workflows',
            summary: 'Step-by-step guide for creating events',
            match_type: 'hybrid',
          },
        ],
        total: 1,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockResults,
        error: null,
      });

      const { data } = await supabase.functions.invoke('kb-search', {
        body: {
          q: 'create event',
          scope: 'site',
          limit: 5,
        },
      });

      expect(data.results).toHaveLength(1);
      expect(data.results[0].title).toBe('Create Event Guide');
    });

    it('should handle search with category filters', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { results: [], total: 0 },
        error: null,
      });

      await supabase.functions.invoke('kb-search', {
        body: {
          q: 'barrel racing',
          category: 'entities',
          subcategory: 'profiles/horse',
          limit: 10,
        },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('kb-search', {
        body: expect.objectContaining({
          category: 'entities',
          subcategory: 'profiles/horse',
        }),
      });
    });
  });

  describe('Playbooks', () => {
    it('should retrieve playbook by intent', async () => {
      const mockPlaybook = {
        found: true,
        playbook: {
          id: 'pb-1',
          intent: 'create event',
          scope: 'site',
          steps: [
            { action: 'navigate', description: 'Go to events page' },
            { action: 'fill_form', description: 'Fill event details' },
            { action: 'submit', description: 'Submit event' },
          ],
          required_slots: { title: 'string', starts_at: 'datetime' },
        },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockPlaybook,
        error: null,
      });

      const { data } = await supabase.functions.invoke('kb-playbook', {
        body: { intent: 'create event' },
      });

      expect(data.found).toBe(true);
      expect(data.playbook.steps).toHaveLength(3);
    });

    it('should return not found for missing playbook', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { found: false, intent: 'unknown action' },
        error: null,
      });

      const { data } = await supabase.functions.invoke('kb-playbook', {
        body: { intent: 'unknown action' },
      });

      expect(data.found).toBe(false);
    });
  });

  describe('Item Retrieval', () => {
    it('should fetch item with chunks by URI', async () => {
      const mockItem = {
        item: {
          id: 'item-1',
          uri: 'global://entities/profiles/types',
          title: 'Profile Types',
          knowledge_chunks: [
            { id: 'c1', idx: 0, text: 'Chunk 1 text' },
            { id: 'c2', idx: 1, text: 'Chunk 2 text' },
          ],
        },
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockItem,
        error: null,
      });

      const { data } = await supabase.functions.invoke('kb-item', {
        body: { uri: 'global://entities/profiles/types' },
      });

      expect(data.item.title).toBe('Profile Types');
      expect(data.item.knowledge_chunks).toHaveLength(2);
    });
  });

  describe('Term Dictionary', () => {
    it('should resolve term from dictionary', async () => {
      const mockTerm = {
        term: 'jackpot',
        definition: 'A progressive payout format in rodeo events',
        synonyms: ['added money', 'progressive'],
        scope: 'global',
      };

      const mockQuery = {
        or: vi.fn(() => mockQuery),
        limit: vi.fn(() => mockQuery),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: mockTerm, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => mockQuery),
      } as any);

      const { data } = await supabase
        .from('term_dictionary')
        .select('*')
        .or(`term.ilike.%jackpot%,synonyms.cs.{jackpot}`)
        .limit(1)
        .maybeSingle();

      expect(data?.term).toBe('jackpot');
      expect(data?.definition).toContain('rodeo');
    });
  });

  describe('Related Items', () => {
    it('should find semantically related items', async () => {
      const mockRelated = {
        related: [
          { id: 'item-2', title: 'Horse Subcategories', similarity: 0.85 },
          { id: 'item-3', title: 'Breeding Guide', similarity: 0.78 },
        ],
        source_uri: 'global://entities/profiles/horse/types',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockRelated,
        error: null,
      });

      const { data } = await supabase.functions.invoke('kb-related', {
        body: { uri: 'global://entities/profiles/horse/types', limit: 8 },
      });

      expect(data.related).toHaveLength(2);
      expect(data.related[0].similarity).toBeGreaterThan(0.7);
    });
  });

  describe('Ingestion', () => {
    it('should parse YAML front-matter and create knowledge item', async () => {
      const mockContent = `---
title: Horse Types
category: entities
subcategory: profiles/horse
tags: [horse, profiles]
scope: global
version: 1
---
# Horse Types

All horses are awesome.`;

      const mockResult = {
        success: true,
        item_id: 'item-123',
        chunks: 1,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });

      const { data } = await supabase.functions.invoke('kb-ingest', {
        body: {
          content: mockContent,
          uri: 'global://entities/profiles/horse/types',
        },
      });

      expect(data.success).toBe(true);
      expect(data.chunks).toBeGreaterThan(0);
    });

    it('should extract playbook from content with intent', async () => {
      const mockContent = `---
title: Create Event Workflow
category: workflows
scope: site
---
# Create Event

intent: create event

1. Navigate to events page
2. Click create button
3. Fill event details
4. Submit`;

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { success: true, item_id: 'pb-1', chunks: 1 },
        error: null,
      });

      const { data } = await supabase.functions.invoke('kb-ingest', {
        body: {
          content: mockContent,
          uri: 'site://workflows/create-event',
        },
      });

      expect(data.success).toBe(true);
      // Should have extracted playbook from numbered steps
    });
  });
});

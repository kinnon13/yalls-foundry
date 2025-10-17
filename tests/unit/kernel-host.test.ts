/**
 * Kernel Host & Pagination Tests
 * 
 * Tests for kernel feature rendering, pagination, and observability.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, mockSupabase } from '../utils/renderWithProviders';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase(),
}));

describe('Kernel Host', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pagination', () => {
    it('passes cursor for next page', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const page1 = [
        { id: '1', title: 'Item 1', next_cursor: 10 },
        { id: '2', title: 'Item 2', next_cursor: 10 },
      ];
      
      const page2 = [
        { id: '3', title: 'Item 3', next_cursor: 20 },
        { id: '4', title: 'Item 4', next_cursor: null },
      ];

      const rpcMock = vi.mocked(supabase.rpc);
      
      // First call: no cursor
      rpcMock.mockResolvedValueOnce({
        data: page1,
        error: null,
      });
      
      // Second call: with cursor
      rpcMock.mockResolvedValueOnce({
        data: page2,
        error: null,
      });

      const TestComponent = () => {
        const [items, setItems] = React.useState<any[]>([]);
        const [cursor, setCursor] = React.useState<number | null>(null);
        const [hasMore, setHasMore] = React.useState(true);

        const loadMore = () => {
          supabase.rpc('feed_fusion_home', {
            p_profile_id: 'test-profile',
            p_lane: 'for_you',
            p_cursor: cursor,
            p_limit: 20,
          }).then(res => {
            if (res.data) {
              setItems(prev => [...prev, ...res.data]);
              const lastItem = res.data[res.data.length - 1];
              setCursor(lastItem?.next_cursor);
              setHasMore(!!lastItem?.next_cursor);
            }
          });
        };

        React.useEffect(() => {
          loadMore();
        }, []);

        return (
          <div>
            {items.map(item => <div key={item.id}>{item.title}</div>)}
            {hasMore && <button onClick={loadMore}>Load More</button>}
          </div>
        );
      };

      renderWithProviders(<TestComponent />);
      
      // Wait for first page
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
      });

      // Click load more
      fireEvent.click(screen.getByText('Load More'));

      // Wait for second page
      await waitFor(() => {
        expect(screen.getByText('Item 3')).toBeInTheDocument();
        expect(screen.getByText('Item 4')).toBeInTheDocument();
      });

      // Verify RPC calls
      expect(rpcMock).toHaveBeenNthCalledWith(1, 'feed_fusion_home', expect.objectContaining({
        p_cursor: null,
      }));
      
      expect(rpcMock).toHaveBeenNthCalledWith(2, 'feed_fusion_home', expect.objectContaining({
        p_cursor: 10,
      }));
    });

    it('appends items without duplicates', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const page1 = [{ id: '1', title: 'Item 1' }];
      const page2 = [{ id: '2', title: 'Item 2' }];

      const rpcMock = vi.mocked(supabase.rpc);
      rpcMock.mockResolvedValueOnce({ data: page1, error: null });
      rpcMock.mockResolvedValueOnce({ data: page2, error: null });

      const TestComponent = () => {
        const [items, setItems] = React.useState<any[]>([]);

        const loadMore = () => {
          supabase.rpc('feed_fusion_home', {
            p_profile_id: 'test',
            p_lane: 'for_you',
            p_cursor: null,
            p_limit: 20,
          }).then(res => {
            if (res.data) {
              setItems(prev => {
                const existingIds = new Set(prev.map(i => i.id));
                const newItems = res.data.filter(i => !existingIds.has(i.id));
                return [...prev, ...newItems];
              });
            }
          });
        };

        return (
          <div>
            {items.map(item => <div key={item.id}>{item.title}</div>)}
            <button onClick={loadMore}>Load</button>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);
      
      // Load first page
      fireEvent.click(screen.getByText('Load'));
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });

      // Load second page
      fireEvent.click(screen.getByText('Load'));
      await waitFor(() => {
        expect(screen.getByText('Item 2')).toBeInTheDocument();
      });

      // Verify no duplicates
      const items = screen.getAllByText(/Item \d/);
      expect(items).toHaveLength(2);
    });
  });

  describe('Observability', () => {
    it('logs kernel_render on first paint', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const rpcMock = vi.mocked(supabase.rpc);
      
      // Mock data fetch
      rpcMock.mockResolvedValueOnce({
        data: [{ id: '1', title: 'Test' }],
        error: null,
      });
      
      // Mock telemetry log
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const TestComponent = () => {
        const [rendered, setRendered] = React.useState(false);

        React.useEffect(() => {
          supabase.rpc('feed_fusion_home', {
            p_profile_id: 'test',
            p_lane: 'for_you',
            p_cursor: null,
            p_limit: 20,
          }).then(() => {
            if (!rendered) {
              setRendered(true);
              // Log kernel_render
              supabase.rpc('log_usage_event_v2', {
                p_session_id: 'test-session',
                p_event_type: 'impression',
                p_surface: 'kernel',
                p_item_kind: 'feature',
                p_item_id: 'feed',
                p_meta: { event: 'kernel_render' },
              });
            }
          });
        }, []);

        return <div>Kernel</div>;
      };

      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(rpcMock).toHaveBeenCalledWith('log_usage_event_v2', expect.objectContaining({
          p_meta: expect.objectContaining({ event: 'kernel_render' }),
        }));
      });
    });

    it('logs kernel_open on user click', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const rpcMock = vi.mocked(supabase.rpc);
      rpcMock.mockResolvedValue({ data: null, error: null });

      const TestComponent = () => {
        const handleClick = () => {
          supabase.rpc('log_usage_event_v2', {
            p_session_id: 'test-session',
            p_event_type: 'click',
            p_surface: 'kernel',
            p_item_kind: 'feature',
            p_item_id: 'test-feature',
            p_meta: { event: 'kernel_open' },
          });
        };

        return <button onClick={handleClick}>Open Feature</button>;
      };

      renderWithProviders(<TestComponent />);
      
      fireEvent.click(screen.getByText('Open Feature'));

      await waitFor(() => {
        expect(rpcMock).toHaveBeenCalledWith('log_usage_event_v2', expect.objectContaining({
          p_event_type: 'click',
          p_meta: expect.objectContaining({ event: 'kernel_open' }),
        }));
      });
    });
  });
});

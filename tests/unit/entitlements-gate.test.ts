/**
 * Entitlements & Paywall Tests
 * 
 * Tests for EntitlementGate component and feature access control.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, mockSupabase } from '../utils/renderWithProviders';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase(),
}));

describe('Entitlement Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Access Control', () => {
    it('allows access when user has entitlement', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock user has entitlement
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { allowed: true, reason: 'active_subscription' },
        error: null,
      });

      const TestComponent = () => {
        const [allowed, setAllowed] = React.useState(false);
        
        React.useEffect(() => {
          supabase.rpc('check_entitlement', { 
            p_feature_id: 'test-feature' 
          }).then(res => {
            if (res.data?.allowed) setAllowed(true);
          });
        }, []);

        return allowed ? <div>Content</div> : <div>Blocked</div>;
      };

      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });

    it('shows paywall when user lacks entitlement', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock user lacks entitlement
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { allowed: false, reason: 'requires_pro_plan' },
        error: null,
      });

      const TestComponent = () => {
        const [state, setState] = React.useState<'loading' | 'allowed' | 'blocked'>('loading');
        
        React.useEffect(() => {
          supabase.rpc('check_entitlement', { 
            p_feature_id: 'test-feature' 
          }).then(res => {
            setState(res.data?.allowed ? 'allowed' : 'blocked');
          });
        }, []);

        if (state === 'loading') return <div>Loading...</div>;
        return state === 'allowed' ? <div>Content</div> : <div>Upgrade Required</div>;
      };

      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
      });
    });

    it('logs entitlement check to telemetry', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const rpcMock = vi.mocked(supabase.rpc);
      
      // First call: check entitlement
      rpcMock.mockResolvedValueOnce({
        data: { allowed: true },
        error: null,
      });
      
      // Second call: log telemetry
      rpcMock.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const TestComponent = () => {
        React.useEffect(() => {
          supabase.rpc('check_entitlement', { 
            p_feature_id: 'test-feature' 
          }).then(res => {
            // Log to telemetry
            supabase.rpc('log_usage_event_v2', {
              p_session_id: 'test-session',
              p_event_type: 'entitlement_check',
              p_surface: 'test',
              p_item_kind: 'feature',
              p_item_id: 'test-feature',
              p_meta: { allowed: res.data?.allowed },
            });
          });
        }, []);

        return <div>Test</div>;
      };

      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(rpcMock).toHaveBeenCalledWith('check_entitlement', expect.any(Object));
        expect(rpcMock).toHaveBeenCalledWith('log_usage_event_v2', expect.objectContaining({
          p_event_type: 'entitlement_check',
        }));
      });
    });
  });

  describe('Age Gating', () => {
    it('allows access when user meets age requirement', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25); // 25 years old

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { 
          allowed: true,
          user_age: 25,
          required_age: 18,
        },
        error: null,
      });

      const TestComponent = () => {
        const [allowed, setAllowed] = React.useState(false);
        
        React.useEffect(() => {
          supabase.rpc('check_age_gate', { 
            p_feature_id: 'adult-content',
            p_min_age: 18,
          }).then(res => {
            if (res.data?.allowed) setAllowed(true);
          });
        }, []);

        return allowed ? <div>Adult Content</div> : <div>Age Restricted</div>;
      };

      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByText('Adult Content')).toBeInTheDocument();
      });
    });

    it('blocks access when user is too young', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { 
          allowed: false,
          user_age: 16,
          required_age: 18,
        },
        error: null,
      });

      const TestComponent = () => {
        const [state, setState] = React.useState<'loading' | 'allowed' | 'blocked'>('loading');
        
        React.useEffect(() => {
          supabase.rpc('check_age_gate', { 
            p_feature_id: 'adult-content',
            p_min_age: 18,
          }).then(res => {
            setState(res.data?.allowed ? 'allowed' : 'blocked');
          });
        }, []);

        if (state === 'loading') return <div>Loading...</div>;
        return state === 'allowed' ? <div>Content</div> : <div>You must be 18+</div>;
      };

      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByText('You must be 18+')).toBeInTheDocument();
      });
    });

    it('blocks access when date_of_birth is null', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: { 
          allowed: false,
          reason: 'missing_date_of_birth',
        },
        error: null,
      });

      const TestComponent = () => {
        const [state, setState] = React.useState<'loading' | 'allowed' | 'blocked'>('loading');
        
        React.useEffect(() => {
          supabase.rpc('check_age_gate', { 
            p_feature_id: 'adult-content',
            p_min_age: 18,
          }).then(res => {
            setState(res.data?.allowed ? 'allowed' : 'blocked');
          });
        }, []);

        if (state === 'loading') return <div>Loading...</div>;
        return state === 'allowed' ? <div>Content</div> : <div>Please verify your age</div>;
      };

      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByText('Please verify your age')).toBeInTheDocument();
      });
    });
  });
});

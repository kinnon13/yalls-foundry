import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ThemeTokens {
  brand?: {
    primary?: string;
    accent?: string;
  };
  surface?: {
    bg?: string;
    card?: string;
  };
  text?: {
    primary?: string;
    muted?: string;
  };
  density?: {
    scale?: number;
  };
}

/**
 * ThemeBroker Component
 * 
 * Loads and applies theme overrides at runtime.
 * Priority: workspace override → user override → default theme
 * 
 * Mount this at the app root to enable dynamic theming.
 */
export function ThemeBroker() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    }
  });

  // Get current workspace/entity ID from URL or context
  const currentEntityId = getCurrentEntityId();

  // Fetch theme with priority resolution
  const { data: theme } = useQuery({
    queryKey: ['theme', session?.user?.id, currentEntityId],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      let resolvedTheme: ThemeTokens | null = null;

      // Try workspace theme first (if we have an entity context)
      if (currentEntityId) {
        try {
          // Call RPC using functions.invoke for type safety until types regenerate
          const { data: workspaceTheme } = await supabase.functions.invoke('get_theme', {
            body: {
              p_subject_type: 'entity',
              p_subject_id: currentEntityId
            }
          });

          if (workspaceTheme && typeof workspaceTheme === 'object' && Object.keys(workspaceTheme).length > 0) {
            resolvedTheme = workspaceTheme as ThemeTokens;
          }
        } catch (e) {
          console.warn('Failed to load workspace theme:', e);
        }
      }

      // Fallback to user theme if no workspace theme
      if (!resolvedTheme || Object.keys(resolvedTheme).length === 0) {
        try {
          const { data: userTheme } = await supabase.functions.invoke('get_theme', {
            body: {
              p_subject_type: 'user',
              p_subject_id: session.user.id
            }
          });

          if (userTheme && typeof userTheme === 'object' && Object.keys(userTheme).length > 0) {
            resolvedTheme = userTheme as ThemeTokens;
          }
        } catch (e) {
          console.warn('Failed to load user theme:', e);
        }
      }

      return resolvedTheme;
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Apply theme when it changes
  useEffect(() => {
    if (theme) {
      applyTheme(theme);
    }
  }, [theme]);

  return null; // This is a non-rendering component
}

/**
 * Apply theme tokens to CSS custom properties
 */
function applyTheme(tokens: ThemeTokens) {
  const root = document.documentElement;

  // Brand colors
  if (tokens.brand) {
    if (tokens.brand.primary) {
      root.style.setProperty('--brand-primary', tokens.brand.primary);
    }
    if (tokens.brand.accent) {
      root.style.setProperty('--brand-accent', tokens.brand.accent);
    }
  }

  // Surface colors
  if (tokens.surface) {
    if (tokens.surface.bg) {
      root.style.setProperty('--surface-bg', tokens.surface.bg);
    }
    if (tokens.surface.card) {
      root.style.setProperty('--surface-card', tokens.surface.card);
    }
  }

  // Text colors
  if (tokens.text) {
    if (tokens.text.primary) {
      root.style.setProperty('--text-primary', tokens.text.primary);
    }
    if (tokens.text.muted) {
      root.style.setProperty('--text-muted', tokens.text.muted);
    }
  }

  // Density scale
  if (tokens.density?.scale !== undefined) {
    root.style.setProperty('--density-scale', tokens.density.scale.toString());
  }
}

/**
 * Get current entity ID from URL or context
 * This is a simplified version - you may need to adapt based on your routing
 */
function getCurrentEntityId(): string | null {
  const path = window.location.pathname;
  
  // Extract entityId from /workspace/:entityId/* routes
  const workspaceMatch = path.match(/\/workspace\/([^/]+)/);
  if (workspaceMatch) {
    return workspaceMatch[1];
  }

  // Add other patterns as needed
  return null;
}

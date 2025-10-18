/**
 * UIProvider - Global design system context
 * Manages theme, motion preferences, and a11y settings
 */

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { ReactNode, useEffect } from 'react';
import { tokens } from './tokens';

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  useEffect(() => {
    // Apply design tokens as CSS variables
    const root = document.documentElement;
    
    // Motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      root.style.setProperty('--motion-duration-fast', '0ms');
      root.style.setProperty('--motion-duration-normal', '0ms');
      root.style.setProperty('--motion-duration-slow', '0ms');
    } else {
      root.style.setProperty('--motion-duration-fast', `${tokens.motion.duration.fast}ms`);
      root.style.setProperty('--motion-duration-normal', `${tokens.motion.duration.normal}ms`);
      root.style.setProperty('--motion-duration-slow', `${tokens.motion.duration.slow}ms`);
    }
    
    // Z-index scale
    Object.entries(tokens.zIndex).forEach(([key, value]) => {
      root.style.setProperty(`--z-${key}`, String(value));
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster />
      <Sonner />
    </ThemeProvider>
  );
}

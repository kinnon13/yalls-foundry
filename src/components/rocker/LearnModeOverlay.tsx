/**
 * Learn Mode Overlay
 * Visual confirmation UI for teaching Rocker which element to use
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LearnModeOverlayProps {
  candidates: HTMLElement[];
  question: string;
  onAnswer: (confirmed: boolean, element?: HTMLElement) => void;
}

export function LearnModeOverlay({ candidates, question, onAnswer }: LearnModeOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (candidates.length === 0) {
      onAnswer(false);
      return;
    }

    // Save focus to restore on cleanup
    const prevActive = document.activeElement as HTMLElement | null;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'y' || key === 'enter') {
        e.preventDefault();
        onAnswer(true, candidates[currentIndex]);
      } else if (key === 'n' || key === 'arrowright') {
        e.preventDefault();
        setCurrentIndex((i) => (i + 1) % candidates.length);
      } else if (key === 'arrowleft') {
        e.preventDefault();
        setCurrentIndex((i) => (i - 1 + candidates.length) % candidates.length);
      } else if (key === 'escape') {
        e.preventDefault();
        onAnswer(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      prevActive?.focus?.();
    };
  }, [candidates, currentIndex, onAnswer]);

  if (!mounted || candidates.length === 0) return null;

  const current = candidates[currentIndex];
  if (!current) return null;

  const rect = current.getBoundingClientRect();

  return createPortal(
    <>
      {/* Highlight ring */}
      <div
        className="learn-mode-highlight"
        style={{
          position: 'fixed',
          left: `${rect.left - 6}px`,
          top: `${rect.top - 6}px`,
          width: `${rect.width + 12}px`,
          height: `${rect.height + 12}px`,
          border: '3px solid hsl(var(--primary))',
          borderRadius: '8px',
          boxShadow: '0 0 0 6px hsla(var(--primary), 0.25), 0 0 20px hsla(var(--primary), 0.4)',
          pointerEvents: 'none',
          zIndex: 2147483647,
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      
      {/* Info tooltip */}
      <div
        style={{
          position: 'fixed',
          left: `${Math.max(10, rect.left)}px`,
          top: `${Math.max(10, rect.bottom + 10)}px`,
          background: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px hsla(0, 0%, 0%, 0.15)',
          zIndex: 2147483647,
          maxWidth: '320px',
          fontSize: '14px',
          border: '1px solid hsl(var(--border))'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>
          🤖 Rocker Learn Mode
        </div>
        <div style={{ marginBottom: '12px', opacity: 0.9 }}>
          {question}
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
          <kbd style={{ 
            padding: '2px 6px', 
            background: 'hsl(var(--muted))', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            Y
          </kbd>
          <span style={{ opacity: 0.7 }}>Yes</span>
          <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
          <kbd style={{ 
            padding: '2px 6px', 
            background: 'hsl(var(--muted))', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            N
          </kbd>
          <span style={{ opacity: 0.7 }}>Next ({currentIndex + 1}/{candidates.length})</span>
          <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
          <kbd style={{ 
            padding: '2px 6px', 
            background: 'hsl(var(--muted))', 
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            Esc
          </kbd>
          <span style={{ opacity: 0.7 }}>Cancel</span>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.02);
            opacity: 0.8;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .learn-mode-highlight {
            animation: none !important;
          }
        }
        
        @media (prefers-contrast: high) {
          .learn-mode-highlight {
            border-width: 4px !important;
            box-shadow: 0 0 0 8px hsla(var(--primary), 0.4) !important;
          }
        }
      `}</style>
    </>,
    document.body
  );
}

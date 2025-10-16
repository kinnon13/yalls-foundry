/**
 * Capability Highlighter
 * Visual overlay showing all elements Rocker can interact with
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { upsertSelector } from '@/lib/ai/rocker/memory';
import { toast } from '@/hooks/use-toast';

interface Capability {
  element: HTMLElement;
  type: 'field' | 'button';
  name: string;
  selector: string;
}

interface CapabilityHighlighterProps {
  userId: string;
  onFlagMissing?: () => void;
}

export function CapabilityHighlighter({ userId, onFlagMissing }: CapabilityHighlighterProps) {
  const [visible, setVisible] = useState(false);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [flagMode, setFlagMode] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const scan = () => {
      const caps: Capability[] = [];
      const fieldSel = 'textarea, input:not([type="hidden"]), [contenteditable="true"]';
      const btnSel = 'button:not([disabled]), [role="button"], a[href]';

      // Scan all scopes (main doc + shadow roots + iframes)
      function* scopes() {
        yield document;
        for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
          const sr = (el as any).shadowRoot;
          if (sr) yield sr;
        }
      }

      for (const root of scopes()) {
        // Fields
        Array.from(root.querySelectorAll(fieldSel) as NodeListOf<HTMLElement>).forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const cs = window.getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') return;

          const name = 
            el.dataset.rocker || 
            el.getAttribute('aria-label') || 
            el.getAttribute('placeholder') || 
            el.getAttribute('name') || 
            'unnamed field';

          caps.push({
            element: el,
            type: 'field',
            name,
            selector: buildSelector(el)
          });
        });

        // Buttons
        Array.from(root.querySelectorAll(btnSel) as NodeListOf<HTMLElement>).forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const cs = window.getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') return;

          const name = 
            el.dataset.rocker || 
            el.getAttribute('aria-label') || 
            el.textContent?.trim().slice(0, 30) || 
            'unnamed button';

          caps.push({
            element: el,
            type: 'button',
            name,
            selector: buildSelector(el)
          });
        });
      }

      setCapabilities(caps);
    };

    scan();
    const interval = setInterval(scan, 2000); // Rescan every 2s
    return () => clearInterval(interval);
  }, [visible]);

  const handleFlag = async (cap: Capability) => {
    const userInput = prompt(`What should Rocker call this ${cap.type}?`, cap.name);
    if (!userInput) return;

    await upsertSelector(
      location.pathname,
      userInput.toLowerCase(),
      cap.selector,
      { type: cap.type, flagged: true }
    );

    toast({
      title: "Capability Flagged",
      description: `Rocker will now recognize "${userInput}"`,
    });
  };

  if (!visible) {
    return (
      <Button
        onClick={() => setVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-20 right-4 z-[2147483640] shadow-lg"
        title="Show what Rocker can do"
      >
        <Eye className="w-4 h-4 mr-2" />
        Show Capabilities
      </Button>
    );
  }

  return createPortal(
    <>
      {/* Highlight rings */}
      {capabilities.map((cap, i) => {
        const rect = cap.element.getBoundingClientRect();
        return (
          <div
            key={i}
            style={{
              position: 'fixed',
              left: `${rect.left - 4}px`,
              top: `${rect.top - 4}px`,
              width: `${rect.width + 8}px`,
              height: `${rect.height + 8}px`,
              border: `2px solid ${cap.type === 'field' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}`,
              borderRadius: '6px',
              pointerEvents: flagMode ? 'auto' : 'none',
              cursor: flagMode ? 'pointer' : 'default',
              zIndex: 2147483645,
              boxShadow: `0 0 0 3px ${cap.type === 'field' ? 'hsla(var(--primary), 0.15)' : 'hsla(var(--accent), 0.15)'}`,
              transition: 'all 0.2s ease'
            }}
            onClick={flagMode ? () => handleFlag(cap) : undefined}
            title={flagMode ? `Flag: ${cap.name}` : cap.name}
          />
        );
      })}

      {/* Control panel */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          background: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px hsla(0, 0%, 0%, 0.2)',
          zIndex: 2147483647,
          border: '1px solid hsl(var(--border))',
          minWidth: '250px'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
          🤖 Rocker Capabilities
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '12px' }}>
          Found {capabilities.length} interactive elements
          <div style={{ marginTop: '4px' }}>
            <span style={{ color: 'hsl(var(--primary))' }}>●</span> Fields ({capabilities.filter(c => c.type === 'field').length})
            {' '}
            <span style={{ color: 'hsl(var(--accent))' }}>●</span> Buttons ({capabilities.filter(c => c.type === 'button').length})
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            onClick={() => setFlagMode(!flagMode)}
            variant={flagMode ? "default" : "outline"}
            size="sm"
            style={{ flex: 1, fontSize: '12px' }}
          >
            <Flag className="w-3 h-3 mr-1" />
            {flagMode ? 'Flagging...' : 'Flag Missing'}
          </Button>
          <Button
            onClick={() => setVisible(false)}
            variant="ghost"
            size="sm"
            style={{ fontSize: '12px' }}
          >
            <EyeOff className="w-3 h-3 mr-1" />
            Hide
          </Button>
        </div>
        {flagMode && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '11px', 
            opacity: 0.7,
            fontStyle: 'italic' 
          }}>
            Click any highlighted element to teach Rocker
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

function buildSelector(el: HTMLElement): string {
  // Prefer stable identifiers
  if (el.id) return `#${el.id}`;
  if (el.dataset.rocker) return `[data-rocker="${el.dataset.rocker}"]`;
  
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return `[aria-label="${ariaLabel}"]`;

  // Fallback to nth-of-type path
  const path: string[] = [];
  let current: HTMLElement | null = el;
  while (current && current !== document.body) {
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current!.tagName);
      const index = siblings.indexOf(current) + 1;
      path.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
    }
    current = parent;
  }
  return path.slice(0, 4).join(' > '); // Max 4 levels for stability
}

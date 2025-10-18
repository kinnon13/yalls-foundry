/**
 * Teaching Mode Overlay
 * 
 * Interactive overlay that highlights all clickable elements with blue/green hue
 * Allows super admin to click elements and teach Rocker what they are
 */

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ElementInfo {
  element: HTMLElement;
  rect: DOMRect;
  selector: string;
  text: string;
}

interface TeachingModeOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

export function TeachingModeOverlay({ isActive, onClose }: TeachingModeOverlayProps) {
  const [interactiveElements, setInteractiveElements] = useState<ElementInfo[]>([]);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [teachingName, setTeachingName] = useState('');
  const [teachingDescription, setTeachingDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Find all interactive elements on the page
  const findInteractiveElements = useCallback(() => {
    const selectors = [
      'button',
      'a[href]',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[tabindex]:not([tabindex="-1"])',
      '[onclick]',
    ];

    const elements: ElementInfo[] = [];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const htmlEl = el as HTMLElement;
        // Skip hidden elements
        if (htmlEl.offsetParent === null) return;
        
        const rect = htmlEl.getBoundingClientRect();
        // Skip tiny elements
        if (rect.width < 10 || rect.height < 10) return;

        const text = htmlEl.textContent?.trim().slice(0, 50) || htmlEl.getAttribute('aria-label') || '';
        
        elements.push({
          element: htmlEl,
          rect,
          selector: generateSelector(htmlEl),
          text,
        });
      });
    });

    setInteractiveElements(elements);
  }, []);

  // Generate a unique selector for an element
  const generateSelector = (element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;
    
    let selector = element.tagName.toLowerCase();
    if (element.className) {
      const classes = Array.from(element.classList)
        .filter(c => !c.startsWith('hover:') && !c.startsWith('focus:'))
        .slice(0, 3)
        .join('.');
      if (classes) selector += `.${classes}`;
    }
    
    // Add data attributes for uniqueness
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        selector += `[${attr.name}="${attr.value}"]`;
      }
    });
    
    return selector;
  };

  // Handle element click
  const handleElementClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    const elementInfo = interactiveElements.find(info => 
      info.element === target || info.element.contains(target)
    );

    if (elementInfo) {
      setSelectedElement(elementInfo);
      setTeachingName(elementInfo.text || '');
      setTeachingDescription('');
    }
  }, [interactiveElements]);

  // Save teaching to memory
  const handleSaveTeaching = async () => {
    if (!selectedElement || !teachingName.trim()) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to AI memory
      await supabase.from('ai_user_memory').insert({
        user_id: user.id,
        tenant_id: user.id,
        type: 'fact',
        scope: 'admin',
        key: `element_${selectedElement.selector}`,
        value: {
          name: teachingName,
          description: teachingDescription,
          selector: selectedElement.selector,
          text: selectedElement.text,
          route: window.location.pathname,
        },
        confidence: 1.0,
        source: 'teaching_mode',
      });

      toast({
        title: 'Teaching Saved!',
        description: `Rocker now knows about "${teachingName}"`,
      });

      setSelectedElement(null);
      setTeachingName('');
      setTeachingDescription('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save teaching',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Set up click listener
  useEffect(() => {
    if (!isActive) return;

    findInteractiveElements();
    
    // Add click listener with capture phase
    document.addEventListener('click', handleElementClick, true);
    
    // Refresh elements on scroll/resize
    const refreshElements = () => findInteractiveElements();
    window.addEventListener('scroll', refreshElements, true);
    window.addEventListener('resize', refreshElements);

    return () => {
      document.removeEventListener('click', handleElementClick, true);
      window.removeEventListener('scroll', refreshElements, true);
      window.removeEventListener('resize', refreshElements);
    };
  }, [isActive, handleElementClick, findInteractiveElements]);

  if (!isActive) return null;

  return createPortal(
    <>
      {/* Overlay backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(2px)',
          zIndex: 2147483640,
          pointerEvents: 'none',
        }}
      />

      {/* Highlighted elements */}
      {interactiveElements.map((info, index) => (
        <div
          key={index}
          style={{
            position: 'fixed',
            left: `${info.rect.left - 4}px`,
            top: `${info.rect.top - 4}px`,
            width: `${info.rect.width + 8}px`,
            height: `${info.rect.height + 8}px`,
            border: selectedElement?.element === info.element 
              ? '3px solid hsl(142, 76%, 36%)' 
              : '2px solid hsl(217, 91%, 60%)',
            borderRadius: '6px',
            boxShadow: selectedElement?.element === info.element
              ? '0 0 0 4px hsla(142, 76%, 36%, 0.2), 0 0 20px hsla(142, 76%, 36%, 0.3)'
              : '0 0 0 3px hsla(217, 91%, 60%, 0.15), 0 0 15px hsla(217, 91%, 60%, 0.2)',
            pointerEvents: 'none',
            zIndex: 2147483645,
            transition: 'all 0.2s ease',
            animation: 'teaching-pulse 2s ease-in-out infinite',
          }}
        />
      ))}

      {/* Control banner */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, hsl(217, 91%, 60%), hsl(142, 76%, 36%))',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        <Brain className="h-5 w-5" />
        <span>Teaching Mode Active - Click any element to teach Rocker</span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <X className="h-4 w-4" />
          Exit
        </button>
      </div>

      {/* Teaching dialog */}
      {selectedElement && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            zIndex: 2147483648,
            minWidth: '400px',
            maxWidth: '500px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Teach Rocker about this element
            </h3>
            <p style={{ fontSize: '13px', opacity: 0.7 }}>
              Element: <code style={{ 
                background: 'hsl(var(--muted))', 
                padding: '2px 6px', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>{selectedElement.selector}</code>
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 500, 
              marginBottom: '6px' 
            }}>
              Name / Label
            </label>
            <Input
              value={teachingName}
              onChange={(e) => setTeachingName(e.target.value)}
              placeholder="e.g., 'Create Post Button'"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 500, 
              marginBottom: '6px' 
            }}>
              Description (optional)
            </label>
            <Textarea
              value={teachingDescription}
              onChange={(e) => setTeachingDescription(e.target.value)}
              placeholder="What does this element do? When should it be used?"
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              onClick={() => setSelectedElement(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTeaching}
              disabled={!teachingName.trim() || isSaving}
            >
              <Check className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Teaching'}
            </Button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes teaching-pulse {
          0%, 100% { 
            opacity: 0.6;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.01);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          [style*="teaching-pulse"] {
            animation: none !important;
          }
        }
      `}</style>
    </>,
    document.body
  );
}

/**
 * Debug HUD
 * Dev-only overlay: Boxes / Grid / Vars
 * Toggle via FAB or Cmd/Ctrl + \` or ?debug=boxes
 */

import { useState, useEffect } from 'react';
import { Bug, Grid, Box, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';

export function DebugHUD() {
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [showBoxes, setShowBoxes] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Check URL param
  useEffect(() => {
    if (searchParams.get('debug') === 'boxes') {
      setShowBoxes(true);
      setIsOpen(true);
    }
  }, [searchParams]);

  // Keyboard shortcut: Cmd/Ctrl + `
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (showBoxes) {
      document.body.classList.add('debug-boxes');
    } else {
      document.body.classList.remove('debug-boxes');
    }
  }, [showBoxes]);

  useEffect(() => {
    if (showGrid) {
      document.body.classList.add('debug-grid');
    } else {
      document.body.classList.remove('debug-grid');
    }
  }, [showGrid]);

  // Only show in dev
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* FAB */}
      <Button
        variant="secondary"
        size="sm"
        className="fixed bottom-20 right-4 z-50 rounded-full h-12 w-12 p-0 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bug className="h-5 w-5" />
      </Button>

      {/* HUD Panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-50 bg-background border rounded-lg shadow-xl p-4 w-80">
          <Tabs defaultValue="boxes">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="boxes">Boxes</TabsTrigger>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="vars">Vars</TabsTrigger>
            </TabsList>

            <TabsContent value="boxes" className="space-y-2">
              <Button
                variant={showBoxes ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setShowBoxes(!showBoxes)}
              >
                <Box className="mr-2 h-4 w-4" />
                {showBoxes ? 'Hide Boxes' : 'Show Boxes'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Outlines all DOM elements to debug layout
              </p>
            </TabsContent>

            <TabsContent value="grid" className="space-y-2">
              <Button
                variant={showGrid ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid className="mr-2 h-4 w-4" />
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </Button>
              <p className="text-xs text-muted-foreground">
                8px baseline grid overlay
              </p>
            </TabsContent>

            <TabsContent value="vars" className="space-y-2">
              <div className="text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span>--header-h:</span>
                  <span className="font-semibold">{getComputedStyle(document.documentElement).getPropertyValue('--header-h')}</span>
                </div>
                <div className="flex justify-between">
                  <span>--dock-h:</span>
                  <span className="font-semibold">{getComputedStyle(document.documentElement).getPropertyValue('--dock-h')}</span>
                </div>
                <div className="flex justify-between">
                  <span>viewport:</span>
                  <span className="font-semibold">{window.innerWidth}×{window.innerHeight}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* CSS for debug modes */}
      <style>{`
        .debug-boxes * {
          outline: 1px solid rgba(255, 0, 0, 0.3) !important;
        }
        .debug-grid {
          background-image: 
            linear-gradient(rgba(0, 0, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 255, 0.1) 1px, transparent 1px);
          background-size: 8px 8px;
        }
      `}</style>
    </>
  );
}

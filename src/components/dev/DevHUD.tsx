/**
 * Dev HUD
 * Lightweight developer overlay (toggle with ?dev=1 or Ctrl+Shift+D)
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Code, AlertCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DevHUDProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevHUD({ isOpen, onClose }: DevHUDProps) {
  const location = useLocation();
  const [features, setFeatures] = useState<any[]>([]);
  const [a11yViolations, setA11yViolations] = useState(0);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);

  useEffect(() => {
    // Load route manifest to find features for current route
    fetch('/generated/route-manifest.json')
      .then(res => res.json())
      .then(data => {
        const route = data.routes.find((r: any) => {
          const pattern = r.path.replace(/:(\w+)/g, '[^/]+');
          return new RegExp(`^${pattern}$`).test(location.pathname);
        });

        if (route) {
          // Load features.json to get full feature data
          fetch('/docs/features/features.json')
            .then(res => res.json())
            .then(featData => {
              const matchedFeatures = featData.features.filter((f: any) =>
                route.features.includes(f.id)
              );
              setFeatures(matchedFeatures);
            });
        }
      })
      .catch(console.error);

    // Mock analytics events (in real impl, hook into analytics system)
    const events = ['page_view', 'button_click', 'form_submit'];
    setRecentEvents(events);
  }, [location.pathname]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-auto bg-background border rounded-lg shadow-2xl z-[9999]"
      role="complementary"
      aria-label="Developer HUD"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          <span className="font-semibold text-sm">Dev HUD</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close Dev HUD"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Route Info */}
      <div className="p-3 border-b space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase">Route</div>
        <div className="font-mono text-sm">{location.pathname}</div>
      </div>

      {/* Features */}
      <div className="p-3 border-b space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase">Features</div>
        {features.length === 0 ? (
          <div className="text-sm text-muted-foreground">No features detected</div>
        ) : (
          <div className="space-y-2">
            {features.map(f => (
              <div key={f.id} className="flex items-center justify-between">
                <div className="text-sm">{f.title}</div>
                <Badge
                  className={
                    f.status === 'shell'
                      ? 'bg-gray-500'
                      : f.status === 'full-ui'
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                  }
                >
                  {f.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* A11y Quick Scan */}
      <div className="p-3 border-b space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase">Accessibility</div>
        <div className="flex items-center gap-2">
          <AlertCircle className={`h-4 w-4 ${a11yViolations > 0 ? 'text-red-500' : 'text-green-500'}`} />
          <span className="text-sm">
            {a11yViolations === 0 ? 'No violations detected' : `${a11yViolations} violations`}
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/admin/a11y" target="_blank" rel="noopener noreferrer">
            View Full Report
          </a>
        </Button>
      </div>

      {/* Recent Analytics */}
      <div className="p-3 space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase">
          Recent Events (10s)
        </div>
        {recentEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground">No events</div>
        ) : (
          <ul className="space-y-1">
            {recentEvents.map((evt, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <code className="text-xs">{evt}</code>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Links */}
      <div className="p-3 border-t bg-muted/30 space-y-1">
        <div className="text-xs font-medium text-muted-foreground uppercase">Quick Links</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/features" target="_blank" rel="noopener noreferrer">
              Features
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/routes" target="_blank" rel="noopener noreferrer">
              Routes
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/components" target="_blank" rel="noopener noreferrer">
              Components
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/tests" target="_blank" rel="noopener noreferrer">
              Tests
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

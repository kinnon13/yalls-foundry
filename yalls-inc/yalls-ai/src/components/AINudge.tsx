/**
 * Role: AI Nudge component - contextual AI suggestions
 * Path: yalls-inc/yalls-ai/src/components/AINudge.tsx
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';

interface AINudgeProps {
  role: 'user' | 'creator' | 'business';
  context?: Record<string, any>;
}

export function AINudge({ role, context = {} }: AINudgeProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [role, context]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      // Stub: Replace with actual tiered-kernel.ts call
      const mockSuggestions: Record<string, string[]> = {
        user: ['Follow @creator123 for tech tips', 'Explore trending posts'],
        creator: ['Monetize with $9.99/mo tier', 'Partner with Brand X'],
        business: ['Revenue forecast: +20% next quarter', 'Stock up product Y'],
      };

      setSuggestions(mockSuggestions[role] || []);
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || suggestions.length === 0) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 p-4 shadow-lg border-primary/20">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">AI Suggestion</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading suggestions...</p>
        ) : (
          suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="text-sm p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors"
            >
              {suggestion}
            </div>
          ))
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-3"
        onClick={loadSuggestions}
      >
        Refresh
      </Button>
    </Card>
  );
}

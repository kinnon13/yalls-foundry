/**
 * RockerTray Component
 * Optional container for multiple Rocker suggestions
 */

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { RockerHint } from './RockerHint';

interface RockerTraySuggestion {
  id: string;
  suggestion: string;
  reason: string;
  action?: () => void | Promise<void>;
  actionLabel?: string;
}

interface RockerTrayProps {
  suggestions: RockerTraySuggestion[];
  maxVisible?: number;
}

export function RockerTray({ suggestions, maxVisible = 3 }: RockerTrayProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (suggestions.length === 0) return null;

  const visible = collapsed ? [] : suggestions.slice(0, maxVisible);
  const hasMore = suggestions.length > maxVisible;

  return (
    <Card className="p-4 space-y-3 border-accent/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Rocker Suggests</h3>
        </div>
        {hasMore && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? (
              <>
                Show {suggestions.length}
                <ChevronDown className="h-4 w-4" />
              </>
            ) : (
              <>
                Hide
                <ChevronUp className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
      
      {!collapsed && (
        <div className="space-y-2">
          {visible.map((s) => (
            <RockerHint
              key={s.id}
              suggestion={s.suggestion}
              reason={s.reason}
              action={s.action}
              actionLabel={s.actionLabel}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

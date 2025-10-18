/**
 * RockerTray - Multi-suggestion card (optional)
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="space-y-2 p-4 bg-card border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Rocker Suggests
        </div>
        {hasMore && (
          <button
            type="button"
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
            <RockerHint key={s.id} {...s} />
          ))}
        </div>
      )}
    </div>
  );
}

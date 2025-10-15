/**
 * Rocker Suggestions Component
 * 
 * Displays AI-driven suggestions from Rocker event bus.
 * Appears as floating cards when Rocker has recommendations.
 */

import { useRockerActions } from '@/hooks/useRockerActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, X, Tag, Link, UserPlus, ShoppingBag, Calendar } from 'lucide-react';

const ACTION_ICONS = {
  'suggest.tag': Tag,
  'suggest.link': Link,
  'suggest.follow': UserPlus,
  'suggest.listing': ShoppingBag,
  'suggest.event': Calendar,
};

const ACTION_LABELS = {
  'suggest.tag': 'Tag Suggestions',
  'suggest.link': 'Link Suggestion',
  'suggest.follow': 'Follow Suggestion',
  'suggest.listing': 'Listing Recommendation',
  'suggest.event': 'Event Recommendation',
};

export function RockerSuggestions() {
  const { suggestions, dismissSuggestion, dismissAllSuggestions } = useRockerActions();

  if (suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 space-y-3 max-w-sm">
      {suggestions.slice(0, 3).map((suggestion, idx) => {
        const Icon = ACTION_ICONS[suggestion.type as keyof typeof ACTION_ICONS] || Lightbulb;
        const label = ACTION_LABELS[suggestion.type as keyof typeof ACTION_LABELS] || 'Suggestion';

        return (
          <Card key={idx} className="shadow-lg border-primary/20 bg-card animate-in slide-in-from-right">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{label}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => dismissSuggestion(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-xs">
                {suggestion.payload.message || 'Rocker has a suggestion for you'}
              </CardDescription>

              {/* Render suggestion-specific content */}
              {suggestion.type === 'suggest.tag' && suggestion.payload.tags && (
                <div className="flex flex-wrap gap-1">
                  {suggestion.payload.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {suggestion.payload.cta && (
                <Button size="sm" className="w-full" onClick={() => {
                  // Handle CTA action
                  if (suggestion.payload.url) {
                    window.location.href = suggestion.payload.url;
                  }
                  dismissSuggestion(idx);
                }}>
                  {suggestion.payload.cta}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      {suggestions.length > 3 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={dismissAllSuggestions}
        >
          Dismiss All ({suggestions.length})
        </Button>
      )}
    </div>
  );
}

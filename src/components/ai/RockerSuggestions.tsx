/**
 * Rocker Suggestions Panel
 * Displays AI-powered predictive suggestions
 */

import { useAdvancedRocker } from '@/hooks/useAdvancedRocker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { RockerIcon } from './RockerIcon';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RockerSuggestions() {
  const {
    suggestions,
    isLoading,
    generateSuggestions,
    dismissSuggestion,
    actOnSuggestion,
    isGenerating
  } = useAdvancedRocker();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default: return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RockerIcon />
            <CardTitle>Rocker AI</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Analyzing your activity...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RockerIcon />
            <div>
              <CardTitle>Rocker AI Suggestions</CardTitle>
              <CardDescription>AI-powered insights for your business</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSuggestions()}
            disabled={isGenerating}
          >
            {isGenerating ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              No suggestions yet. Rocker is learning about your business.
            </p>
            <Button
              variant="outline"
              onClick={() => generateSuggestions()}
              disabled={isGenerating}
            >
              Generate Suggestions
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="border-l-4" style={{
                  borderLeftColor: suggestion.priority === 'high' ? 'rgb(239 68 68)' : 
                                   suggestion.priority === 'medium' ? 'rgb(234 179 8)' : 
                                   'rgb(59 130 246)'
                }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getPriorityIcon(suggestion.priority)}
                        <div className="flex-1">
                          <CardTitle className="text-base">{suggestion.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getPriorityColor(suggestion.priority) as any} className="text-xs">
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissSuggestion(suggestion.id)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => actOnSuggestion(suggestion.id)}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Take Action
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

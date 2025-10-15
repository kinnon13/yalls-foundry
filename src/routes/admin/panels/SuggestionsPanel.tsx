/**
 * Platform Suggestions Admin Panel
 * 
 * Review and approve AI-generated platform evolution suggestions
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

interface Suggestion {
  id: string;
  suggestion_type: string;
  title: string;
  description: string;
  config: any;
  supporting_traces_count: number;
  interest_score: number;
  status: string;
  created_at: string;
}

export function SuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('platform_suggestions')
        .select('*')
        .order('interest_score', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSuggestions((data || []) as Suggestion[]);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suggestions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (suggestionId: string) => {
    try {
      setProcessing(suggestionId);

      const { error } = await (supabase.rpc as any)('approve_suggestion', {
        p_suggestion_id: suggestionId,
      });

      if (error) throw error;

      toast({
        title: 'Suggestion Approved',
        description: 'The platform will evolve with this feature.',
      });

      loadSuggestions();
    } catch (error) {
      console.error('Error approving suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve suggestion',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (suggestionId: string) => {
    try {
      setProcessing(suggestionId);

      const { error } = await (supabase as any)
        .from('platform_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

      if (error) throw error;

      toast({
        title: 'Suggestion Rejected',
        description: 'The suggestion has been marked as rejected.',
      });

      loadSuggestions();
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject suggestion',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('generate-suggestions');
      
      if (error) throw error;

      toast({
        title: 'Suggestions Generated',
        description: 'AI has analyzed user feedback and generated new suggestions.',
      });

      loadSuggestions();
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate suggestions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'implemented': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Suggestions</h2>
          <p className="text-muted-foreground">AI-generated evolution proposals</p>
        </div>
        <Button onClick={generateSuggestions} disabled={loading}>
          <Lightbulb className="h-4 w-4 mr-2" />
          Generate New Suggestions
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No suggestions yet. Generate suggestions from user feedback.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {suggestions.map(suggestion => (
            <Card key={suggestion.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{suggestion.suggestion_type}</Badge>
                      <Badge variant={getStatusColor(suggestion.status)}>
                        {suggestion.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {suggestion.supporting_traces_count} user requests
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Score: {(suggestion.interest_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {suggestion.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(suggestion.id)}
                        disabled={processing === suggestion.id}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(suggestion.id)}
                        disabled={processing === suggestion.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-2">{suggestion.description}</CardDescription>
                {Object.keys(suggestion.config).length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground">View config</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(suggestion.config, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

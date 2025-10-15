/**
 * Unknowns Panel - Items Rocker doesn't understand yet
 * Connected to ai_hypotheses table
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Unknown {
  id: string;
  key: string;
  value: any;
  confidence: number;
  evidence: any;
  created_at: string;
  status: string;
}

export function UnknownsPanel() {
  const [unknowns, setUnknowns] = useState<Unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnknown, setSelectedUnknown] = useState<Unknown | null>(null);

  useEffect(() => {
    loadUnknowns();
  }, []);

  async function loadUnknowns() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_hypotheses')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUnknowns(data || []);
    } catch (error) {
      console.error('Failed to load unknowns:', error);
      toast.error('Failed to load unknowns');
    } finally {
      setLoading(false);
    }
  }

  async function resolveUnknown(id: string, action: 'accept' | 'reject') {
    try {
      const { error } = await supabase
        .from('ai_hypotheses')
        .update({ status: action === 'accept' ? 'confirmed' : 'rejected' })
        .eq('id', id);

      if (error) throw error;

      setUnknowns(prev => prev.filter(u => u.id !== id));
      if (selectedUnknown?.id === id) setSelectedUnknown(null);
      toast.success(action === 'accept' ? 'Accepted and saved' : 'Rejected');
    } catch (error) {
      toast.error('Failed to resolve unknown');
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      {/* Left: List */}
      <Card className="col-span-7 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Unknown Items</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Help Rocker learn by confirming or rejecting these guesses
              </p>
            </div>
            <Badge variant="secondary">{unknowns.length} pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : unknowns.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500/30" />
              <p className="text-muted-foreground">No unknowns yet 🎉</p>
              <p className="text-xs text-muted-foreground mt-2">
                When Rocker encounters something uncertain, it'll appear here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-340px)]">
              <div className="space-y-2">
                {unknowns.map(unknown => (
                  <button
                    key={unknown.id}
                    onClick={() => setSelectedUnknown(unknown)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedUnknown?.id === unknown.id
                        ? "bg-primary/5 border-primary"
                        : "bg-background hover:bg-muted/50 border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="font-mono text-sm font-medium">{unknown.key}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(unknown.confidence * 100)}% sure
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      Guess: {typeof unknown.value === 'object' 
                        ? JSON.stringify(unknown.value) 
                        : String(unknown.value)
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(unknown.created_at)}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Right: Detail & Action */}
      <Card className="col-span-5 bg-card/50 p-6">
        {!selectedUnknown ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Select an unknown to review</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-mono text-lg font-semibold mb-2">{selectedUnknown.key}</h3>
              <Badge variant="outline">
                {Math.round(selectedUnknown.confidence * 100)}% confidence
              </Badge>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rocker's Guess
              </label>
              <div className="mt-2 p-4 rounded-lg bg-muted/50 border">
                <pre className="text-sm whitespace-pre-wrap">
                  {typeof selectedUnknown.value === 'object'
                    ? JSON.stringify(selectedUnknown.value, null, 2)
                    : String(selectedUnknown.value)
                  }
                </pre>
              </div>
            </div>

            {selectedUnknown.evidence && Array.isArray(selectedUnknown.evidence) && selectedUnknown.evidence.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Evidence
                </label>
                <div className="mt-2 space-y-2">
                  {selectedUnknown.evidence.map((ev: any, i: number) => (
                    <div key={i} className="p-3 rounded-md bg-muted/50 text-sm">
                      {typeof ev === 'object' ? JSON.stringify(ev) : String(ev)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => resolveUnknown(selectedUnknown.id, 'accept')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accept & Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => resolveUnknown(selectedUnknown.id, 'reject')}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Accepting will save this as a memory. Rejecting will mark it as incorrect.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

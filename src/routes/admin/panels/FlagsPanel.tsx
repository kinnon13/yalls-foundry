/**
 * Content Flags Admin Panel
 * 
 * Review and manage user-reported content
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ContentFlag {
  id: string;
  flagged_content_type: string;
  flagged_content_id: string;
  flag_reason: string;
  flag_details: string | null;
  status: string;
  created_at: string;
}

export function FlagsPanel() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFlags();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-flags-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_flags' },
        () => loadFlags()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const loadFlags = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('content_flags')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setFlags((data || []) as ContentFlag[]);
    } catch (error) {
      console.error('Error loading flags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flags',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (flagId: string) => {
    try {
      setProcessing(flagId);

      const { error } = await (supabase as any)
        .from('content_flags')
        .update({
          status: 'resolved',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', flagId);

      if (error) throw error;

      toast({
        title: 'Flag Resolved',
        description: 'The flag has been marked as resolved.',
      });

      loadFlags();
    } catch (error) {
      console.error('Error resolving flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve flag',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDismiss = async (flagId: string) => {
    try {
      setProcessing(flagId);

      const { error } = await (supabase as any)
        .from('content_flags')
        .update({
          status: 'dismissed',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', flagId);

      if (error) throw error;

      toast({
        title: 'Flag Dismissed',
        description: 'The flag has been dismissed.',
      });

      loadFlags();
    } catch (error) {
      console.error('Error dismissing flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss flag',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case 'dangerous':
      case 'unsafe':
        return 'destructive';
      case 'scam':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Content Flags</h2>
        <p className="text-muted-foreground">Review user-reported content</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : flags.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No {activeTab} flags</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {flags.map(flag => (
                <Card key={flag.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          {flag.flagged_content_type.charAt(0).toUpperCase() + flag.flagged_content_type.slice(1)} Reported
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={getReasonBadgeColor(flag.flag_reason)}>
                            {flag.flag_reason}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(flag.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {activeTab === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResolve(flag.id)}
                            disabled={processing === flag.id}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismiss(flag.id)}
                            disabled={processing === flag.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {flag.flag_details && (
                    <CardContent>
                      <CardDescription>{flag.flag_details}</CardDescription>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Content ID: {flag.flagged_content_id}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Radio, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resolveTenantId } from '@/lib/tenancy/context';
import { StartStreamDialog } from './StartStreamDialog';

export function LiveFeed() {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [activeStream, setActiveStream] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadStreams();
    checkActiveStream();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('live-streams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams'
        },
        () => {
          loadStreams();
          checkActiveStream();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkActiveStream = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .eq('streamer_id', user.id)
        .eq('status', 'live')
        .single();

      if (!error && data) {
        setActiveStream(data);
      }
    } catch (error) {
      // No active stream
    }
  };

  const loadStreams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user ? await resolveTenantId(user.id) : '00000000-0000-0000-0000-000000000000';

      const { data: streamsData, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          profiles:streamer_id (
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'live')
        .order('started_at', { ascending: false });

      if (error) throw error;
      if (streamsData) setStreams(streamsData);
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const startStream = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to start streaming',
        variant: 'destructive',
      });
      return;
    }
    setShowStartDialog(true);
  };

  const endStream = async () => {
    if (!activeStream) return;

    try {
      const { error } = await supabase
        .from('live_streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', activeStream.id);

      if (error) throw error;

      toast({
        title: 'Stream ended',
        description: 'Recording saved. Processing upload...',
      });

      setActiveStream(null);
      loadStreams();
    } catch (error) {
      console.error('Error ending stream:', error);
      toast({
        title: 'Failed to end stream',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">Live Now</h2>
          <div className="flex items-center gap-2">
            {activeStream ? (
              <Button onClick={endStream} variant="destructive">
                <Radio className="h-4 w-4 mr-2 animate-pulse" />
                End Stream
              </Button>
            ) : (
              <Button onClick={startStream}>
                <Radio className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.open(window.location.href, '_blank', 'noopener')}
            >
              Open in new tab
            </Button>
          </div>
        </div>

        {activeStream && (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  YOU ARE LIVE
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Viewers: {activeStream.viewer_count}
                </span>
              </div>
              <CardTitle className="mt-2">{activeStream.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your stream is live. Viewers can now see your content.
              </p>
            </CardContent>
          </Card>
        )}

      {streams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No live streams right now. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <Card key={stream.id} className="hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="destructive" className="animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {stream.viewer_count}
                  </div>
                </div>
                
                {stream.thumbnail_url && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={stream.thumbnail_url} 
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardTitle className="text-lg line-clamp-2 mt-2">
                  {stream.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={stream.profiles?.avatar_url} />
                    <AvatarFallback>{stream.profiles?.display_name?.[0] || 'S'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {stream.profiles?.display_name || 'Anonymous'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      <StartStreamDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        onStreamStarted={() => {
          loadStreams();
          checkActiveStream();
        }}
      />
    </>
  );
}
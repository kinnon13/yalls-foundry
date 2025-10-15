/**
 * Shared Memories Panel
 * 
 * Displays memories shared with the user and pending share requests
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareRequestNotification } from '@/components/rocker/ShareRequestNotification';
import { Share2, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function SharedMemoriesPanel() {
  const [sharedMemories, setSharedMemories] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch shared memories (via memory_links)
      const { data: links } = await supabase
        .from('memory_links')
        .select(`
          *,
          memory:ai_user_memory(
            *,
            originator:profiles!ai_user_memory_originator_profile_id_fkey(display_name)
          )
        `)
        .eq('visible_to_profile_id', user.id)
        .order('created_at', { ascending: false });

      setSharedMemories(links || []);

      // Fetch pending requests (received)
      const { data: received } = await supabase
        .from('memory_share_requests')
        .select(`
          *,
          memory:ai_user_memory(key, value, type),
          from_profile:profiles!memory_share_requests_from_profile_id_fkey(display_name)
        `)
        .eq('to_profile_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingRequests(received || []);

      // Fetch sent requests
      const { data: sent } = await supabase
        .from('memory_share_requests')
        .select(`
          *,
          memory:ai_user_memory(key, value, type),
          to_profile:profiles!memory_share_requests_to_profile_id_fkey(display_name)
        `)
        .eq('from_profile_id', user.id)
        .order('created_at', { ascending: false });

      setSentRequests(sent || []);

    } catch (error) {
      console.error('Error fetching shared data:', error);
      toast.error('Failed to load shared memories');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.functions.invoke('rocker-chat', {
        body: {
          messages: [
            { role: 'user', content: 'accept share request' }
          ],
          tool_call: {
            name: 'respond_to_share_request',
            arguments: { request_id: requestId, action: 'accept' }
          }
        }
      });

      if (error) throw error;

      toast.success('Memory accepted and saved! ✅');
      fetchData();
    } catch (error) {
      console.error('Accept error:', error);
      toast.error('Failed to accept share');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.functions.invoke('rocker-chat', {
        body: {
          messages: [
            { role: 'user', content: 'decline share request' }
          ],
          tool_call: {
            name: 'respond_to_share_request',
            arguments: { request_id: requestId, action: 'decline' }
          }
        }
      });

      if (error) throw error;

      toast.success('Share request declined');
      fetchData();
    } catch (error) {
      console.error('Decline error:', error);
      toast.error('Failed to decline share');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading shared memories...</p>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="shared" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shared">
            Shared with Me ({sharedMemories.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared" className="space-y-4 mt-4">
          {sharedMemories.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No shared memories yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  When someone shares a memory with you, it will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            sharedMemories.map((link) => (
              <Card key={link.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {link.memory?.key || 'Shared Memory'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        From {link.memory?.originator?.display_name || 'Someone'}
                        <span>•</span>
                        {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {link.memory?.type || 'memory'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {typeof link.memory?.value === 'object'
                      ? JSON.stringify(link.memory.value, null, 2)
                      : link.memory?.value}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {request.memory?.key || 'Memory'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        From {request.from_profile?.display_name || 'Someone'}
                      </CardDescription>
                    </div>
                    <Badge className="text-xs">
                      {request.memory?.type || 'memory'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeclineRequest(request.id)}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-4">
          {sentRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No sent requests</p>
              </CardContent>
            </Card>
          ) : (
            sentRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {request.memory?.key || 'Memory'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        To {request.to_profile?.display_name || 'Someone'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        request.status === 'accepted' ? 'default' :
                        request.status === 'declined' ? 'destructive' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {selectedRequest && (
        <ShareRequestNotification
          open={!!selectedRequest}
          onOpenChange={() => setSelectedRequest(null)}
          request={selectedRequest}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
        />
      )}
    </>
  );
}

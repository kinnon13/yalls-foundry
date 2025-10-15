/**
 * Moderator Console
 * Minimal viable queue for content moderation
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Flag, AlertTriangle } from 'lucide-react';

interface ContentFlag {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter_user_id: string;
}

interface ResultFlag {
  id: string;
  event_id: string;
  flag_type: string;
  details: string;
  status: string;
  created_at: string;
  reporter_user_id: string;
  entry_data: any;
}

export function ModeratorConsole() {
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
  const [resultFlags, setResultFlags] = useState<ResultFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const [contentRes, resultRes] = await Promise.all([
        supabase
          .from('content_flags')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('result_flags')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (contentRes.error) throw contentRes.error;
      if (resultRes.error) throw resultRes.error;

      setContentFlags(contentRes.data || []);
      setResultFlags(resultRes.data || []);
    } catch (error) {
      console.error('Error fetching flags:', error);
      toast.error('Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  const handleContentFlagAction = async (flagId: string, action: 'approved' | 'denied') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('content_flags')
        .update({
          status: action === 'approved' ? 'resolved' : 'denied',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: resolutionNotes || null,
        })
        .eq('id', flagId);

      if (error) throw error;

      toast.success(`Flag ${action}`);
      setResolutionNotes('');
      setSelectedFlag(null);
      fetchFlags();
    } catch (error) {
      console.error('Error resolving flag:', error);
      toast.error('Failed to resolve flag');
    }
  };

  const handleResultFlagAction = async (flagId: string, action: 'approved' | 'denied') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('result_flags')
        .update({
          status: action === 'approved' ? 'resolved' : 'denied',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: resolutionNotes || null,
        })
        .eq('id', flagId);

      if (error) throw error;

      toast.success(`Flag ${action}`);
      setResolutionNotes('');
      setSelectedFlag(null);
      fetchFlags();
    } catch (error) {
      console.error('Error resolving flag:', error);
      toast.error('Failed to resolve flag');
    }
  };

  if (loading) {
    return <div className="p-6">Loading moderation queue...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Moderation Console
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">
              Content Flags ({contentFlags.length})
            </TabsTrigger>
            <TabsTrigger value="results">
              Result Flags ({resultFlags.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {contentFlags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending content flags
              </div>
            ) : (
              contentFlags.map((flag) => (
                <Card key={flag.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{flag.content_type}</Badge>
                            <Badge variant="destructive">{flag.reason}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Reported: {new Date(flag.created_at).toLocaleString()}
                          </p>
                          {flag.details && (
                            <p className="text-sm">{flag.details}</p>
                          )}
                        </div>
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>

                      {selectedFlag === flag.id && (
                        <Textarea
                          placeholder="Add resolution notes..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          rows={3}
                        />
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFlag(flag.id === selectedFlag ? null : flag.id)}
                        >
                          {selectedFlag === flag.id ? 'Cancel' : 'Add Notes'}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleContentFlagAction(flag.id, 'approved')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Action
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleContentFlagAction(flag.id, 'denied')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Deny & Keep Content
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {resultFlags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending result flags
              </div>
            ) : (
              resultFlags.map((flag) => (
                <Card key={flag.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{flag.flag_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Reported: {new Date(flag.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm">{flag.details}</p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>

                      {selectedFlag === flag.id && (
                        <Textarea
                          placeholder="Add resolution notes..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          rows={3}
                        />
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFlag(flag.id === selectedFlag ? null : flag.id)}
                        >
                          {selectedFlag === flag.id ? 'Cancel' : 'Add Notes'}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleResultFlagAction(flag.id, 'approved')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Correction
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleResultFlagAction(flag.id, 'denied')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Deny Flag
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

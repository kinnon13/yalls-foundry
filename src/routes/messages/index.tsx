import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Msg = {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  body: string;
  created_at: string;
};

export default function Messages() {
  const { session } = useSession();
  const [toUserId, setToUserId] = useState('');
  const [body, setBody] = useState('');
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!session?.userId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_user_id.eq.${session.userId},recipient_user_id.eq.${session.userId}`)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      toast.error('Failed to load messages');
      console.error(error);
      return;
    }

    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, [session]);

  const send = async () => {
    if (!session?.userId || !toUserId || !body.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('dm_send', {
        p_recipient: toUserId,
        p_body: body,
        p_metadata: {}
      });

      if (error) throw error;

      setBody('');
      await load();
      toast.success('Message sent!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalHeader />
      <div className="container max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Messages</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient User ID</Label>
            <Input
              id="recipient"
              placeholder="Recipient user_id"
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={3}
              placeholder="Type a message… (paste a yalls.ai/r/... link to see disclosure auto-insert)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={send}
              disabled={!toUserId || !body.trim() || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rows.map((m) => (
          <Card key={m.id}>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground mb-2">
                {new Date(m.created_at).toLocaleString()} •{' '}
                {m.sender_user_id === session.userId ? 'You → ' : '← '}
                {m.sender_user_id === session.userId
                  ? m.recipient_user_id
                  : m.sender_user_id}
              </div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </>
  );
}

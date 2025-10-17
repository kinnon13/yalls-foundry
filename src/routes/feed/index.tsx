import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Post = {
  id: string;
  body: string;
  media: any[];
  visibility: 'public' | 'followers' | 'private';
  created_at: string;
  author_user_id: string;
};

export default function Feed() {
  const { session } = useSession();
  const [body, setBody] = useState('');
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      toast.error('Failed to load posts');
      console.error(error);
      return;
    }
    
    setRows((data ?? []) as Post[]);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!session || !body.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('post_create', {
        p_body: body,
        p_visibility: 'public',
        p_entity_id: null,
        p_media: []
      });

      if (error) throw error;

      setBody('');
      await load();
      toast.success('Post created!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Social Feed</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Share something…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              disabled={loading || !body.trim()}
              onClick={submit}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rows.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground mb-2">
                {new Date(p.created_at).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap">{p.body}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

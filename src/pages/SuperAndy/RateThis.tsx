import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
  tenantId?: string | null;
  conversationId?: string | null;
  ledgerId?: string | null;
  correlationId?: string | null;
  compact?: boolean;
};

export default function RateThis({
  tenantId = null,
  conversationId = null,
  ledgerId = null,
  correlationId = null,
  compact = false
}: Props) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    const tagArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const { data, error } = await supabase.functions.invoke('feedback_rate', {
      body: {
        tenantId, conversationId, ledgerId, correlationId,
        rating, comment, tags: tagArray,
        modelName: 'grok-2', source: 'why_panel'
      }
    });

    setSubmitting(false);
    if (!error && data?.ok) setDone(true);
  }

  if (done) {
    return <div className="text-xs text-green-600">Thanks! recorded.</div>;
  }

  return (
    <div className={cn('border rounded p-2 space-y-2', compact && 'p-1')}>
      <div className="flex items-center gap-2">
        <span className="text-xs opacity-70">Rate</span>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={cn('px-2 py-0.5 rounded text-xs border', rating >= n ? 'bg-primary text-primary-foreground' : 'bg-muted')}
              aria-label={`rate ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {!compact && (
        <>
          <Textarea
            placeholder="Optional note (what was good / off?)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="text-sm"
          />
          <Input
            placeholder="tags (comma separated, e.g. planning,accuracy,latency)"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="text-xs"
          />
        </>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={submitting}>Submit</Button>
      </div>
    </div>
  );
}

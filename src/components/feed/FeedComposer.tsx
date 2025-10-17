/**
 * Feed Composer - Target picker + Entity tagging
 * <200 LOC
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Tag, Target } from 'lucide-react';
import { toast } from 'sonner';

type Entity = {
  id: string;
  display_name: string;
  handle: string;
};

type FeedComposerProps = {
  onPostCreated: () => void;
  authorEntities: Entity[];
};

export function FeedComposer({ onPostCreated, authorEntities }: FeedComposerProps) {
  const [body, setBody] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(
    authorEntities[0]?.id || null
  );
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAuthor) throw new Error('Select an author');
      
      const { data, error } = await supabase.rpc('post_publish', {
        p_author_entity_id: selectedAuthor,
        p_body: body,
        p_media: [],
        p_target_entity_ids: selectedTargets,
        p_tag_entity_ids: selectedTags
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Post published');
      setBody('');
      setSelectedTargets([]);
      setSelectedTags([]);
      onPostCreated();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish');
    }
  });

  const handlePublish = () => {
    if (!body.trim()) {
      toast.error('Post cannot be empty');
      return;
    }
    publishMutation.mutate();
  };

  const toggleTarget = (id: string) => {
    setSelectedTargets(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const authorEntity = authorEntities.find(e => e.id === selectedAuthor);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Author selector */}
        {authorEntities.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {authorEntities.map(entity => (
              <Button
                key={entity.id}
                variant={selectedAuthor === entity.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAuthor(entity.id)}
              >
                {entity.display_name}
              </Button>
            ))}
          </div>
        )}

        {/* Composer */}
        <Textarea
          placeholder="What's happening?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />

        {/* Selected targets */}
        {selectedTargets.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Cross-post to:</span>
            {selectedTargets.map(id => {
              const entity = authorEntities.find(e => e.id === id);
              return (
                <Badge key={id} variant="secondary">
                  {entity?.display_name}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => toggleTarget(id)}
                  />
                </Badge>
              );
            })}
          </div>
        )}

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Tagged:</span>
            {selectedTags.map(id => {
              const entity = authorEntities.find(e => e.id === id);
              return (
                <Badge key={id} variant="outline">
                  {entity?.display_name}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => toggleTag(id)}
                  />
                </Badge>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTargetPicker(!showTargetPicker)}
            >
              <Target className="h-4 w-4 mr-1" />
              Cross-post
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTagPicker(!showTagPicker)}
            >
              <Tag className="h-4 w-4 mr-1" />
              Tag
            </Button>
          </div>

          <Button onClick={handlePublish} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? 'Publishing...' : 'Publish'}
          </Button>
        </div>

        {/* Target picker */}
        {showTargetPicker && (
          <div className="border rounded p-2 space-y-2">
            <p className="text-sm font-medium">Select pages to cross-post:</p>
            <div className="flex gap-2 flex-wrap">
              {authorEntities
                .filter(e => e.id !== selectedAuthor)
                .map(entity => (
                  <Button
                    key={entity.id}
                    variant={selectedTargets.includes(entity.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTarget(entity.id)}
                  >
                    {entity.display_name}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Tag picker */}
        {showTagPicker && (
          <div className="border rounded p-2 space-y-2">
            <p className="text-sm font-medium">Tag entities:</p>
            <div className="flex gap-2 flex-wrap">
              {authorEntities.map(entity => (
                <Button
                  key={entity.id}
                  variant={selectedTags.includes(entity.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTag(entity.id)}
                >
                  {entity.display_name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

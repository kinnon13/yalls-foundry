/**
 * @feature(composer_core)
 * Core Composer Component
 * Rich text editor with media support
 */

import React, { useState } from 'react';
import { ImagePlus, Calendar, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export function ComposerCore() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string[]>([]);

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="What's happening?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        
        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg bg-muted">
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => setMedia(media.filter((_, idx) => idx !== i))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <ImagePlus className="h-4 w-4 mr-2" />
            Media
          </Button>
          <Button variant="ghost" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>

        <Button disabled={!content.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Post
        </Button>
      </div>
    </Card>
  );
}

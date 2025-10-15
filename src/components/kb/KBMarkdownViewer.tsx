import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Edit, History, Zap, ExternalLink, Tag, Calendar } from 'lucide-react';
import type { KnowledgeItem } from '@/lib/ai/rocker/kb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface KBMarkdownViewerProps {
  item: KnowledgeItem;
  onClose: () => void;
  onUpdate: () => void;
}

export function KBMarkdownViewer({ item, onClose, onUpdate }: KBMarkdownViewerProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editMetadata, setEditMetadata] = useState({
    title: item.title,
    summary: item.summary || '',
    tags: item.tags?.join(', ') || ''
  });
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    // Reconstruct YAML front-matter + markdown
    const yamlBlock = `---
title: ${item.title}
category: ${item.category}
${item.subcategory ? `subcategory: ${item.subcategory}\n` : ''}tags: [${item.tags?.join(', ')}]
scope: ${item.scope}
version: ${item.version || 1}
---

`;
    
    const chunks = item.chunks || [];
    const content = chunks.map(c => c.text).join('\n\n');
    setEditContent(yamlBlock + content);
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Call kb-ingest to re-ingest the edited content
      const { error } = await supabase.functions.invoke('kb-ingest', {
        body: {
          content: editContent,
          uri: item.uri,
          scope: item.scope
        }
      });

      if (error) throw error;

      toast.success('Knowledge updated successfully');
      setEditOpen(false);
      onUpdate();
    } catch (error) {
      console.error('[KB Viewer] Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumb = [
    item.scope,
    item.category,
    item.subcategory,
    item.title
  ].filter(Boolean).join(' / ');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold leading-tight mb-1">
              {item.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {breadcrumb}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={item.scope === 'global' ? 'default' : 'secondary'}>
            {item.scope}
          </Badge>
          {item.updated_at && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(item.updated_at).toLocaleDateString()}
            </span>
          )}
          {item.version && (
            <span className="text-muted-foreground">
              v{item.version}
            </span>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs gap-1">
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Edit Knowledge Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editMetadata.title}
                      onChange={(e) => setEditMetadata({ ...editMetadata, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={editMetadata.tags}
                      onChange={(e) => setEditMetadata({ ...editMetadata, tags: e.target.value })}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Summary</Label>
                  <Textarea
                    value={editMetadata.summary}
                    onChange={(e) => setEditMetadata({ ...editMetadata, summary: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content (YAML + Markdown)</Label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            History
          </Button>

          {item.source_bucket_path && (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={item.source_bucket_path} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Source
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {item.summary && (
            <div className="not-prose bg-muted/50 p-4 rounded-lg mb-6 border">
              <p className="text-sm text-muted-foreground m-0">
                {item.summary}
              </p>
            </div>
          )}

          {item.chunks && item.chunks.length > 0 ? (
            item.chunks.map((chunk, idx) => (
              <div key={chunk.id || idx} className="mb-4">
                  <ReactMarkdown
                    components={{
                      code(props) {
                        const { children, className } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {chunk.text}
                  </ReactMarkdown>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No content available</p>
          )}
        </div>
      </ScrollArea>

      {/* Related Items (future) */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          Related Knowledge
        </div>
        <p className="text-xs text-muted-foreground">
          Coming soon: Semantically related items
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ingestKnowledge } from '@/lib/ai/rocker/kb';
import { Loader2, Upload, FileText } from 'lucide-react';

export function KnowledgeIngestPanel() {
  const [content, setContent] = useState('');
  const [uri, setUri] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIngest = async () => {
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }
    if (!uri.trim()) {
      toast.error('URI is required (e.g., global://workflows/business-overview)');
      return;
    }

    // Validate YAML front-matter exists
    if (!content.trim().startsWith('---')) {
      toast.error('Content must include YAML front-matter (starting with ---)');
      return;
    }

    setLoading(true);
    try {
      await ingestKnowledge(content, uri);
      toast.success('Knowledge ingested successfully');
      setContent('');
      setUri('');
    } catch (error) {
      console.error('Ingest error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to ingest knowledge');
    } finally {
      setLoading(false);
    }
  };

  const insertTemplate = () => {
    setContent(`---
title: Business Overview
category: business
subcategory: overview
tags: [overview, business]
scope: global
version: 1
---

# Business Overview

Write your business overview here in markdown.

## Key Information
- Mission
- Vision
- Core Values
- Products/Services

## Operations
- Processes
- Workflows
- Standard procedures
`);
    setUri('global://business/overview');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Knowledge Ingestion
        </CardTitle>
        <CardDescription>
          Add knowledge to Rocker's knowledge base. Content must be markdown with YAML front-matter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="uri">URI</Label>
          <Input
            id="uri"
            placeholder="global://category/subcategory/name"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Format: scope://category/path (e.g., global://workflows/create-event)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Content (Markdown + YAML front-matter)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertTemplate}
            >
              Insert Template
            </Button>
          </div>
          <Textarea
            id="content"
            placeholder="Paste your markdown content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-sm min-h-[400px]"
          />
          <p className="text-sm text-muted-foreground">
            Required front-matter fields: title, category, scope. Optional: subcategory, tags, version.
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
          <p className="font-medium">Scope options:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><code>global</code> - Available to everyone</li>
            <li><code>site</code> - Tenant-specific knowledge</li>
            <li><code>user</code> - Personal knowledge</li>
          </ul>
          <p className="font-medium mt-3">Auto-playbook extraction:</p>
          <p className="text-muted-foreground">
            If your content includes <code>intent: action name</code> and numbered steps, 
            it will automatically create a playbook.
          </p>
        </div>

        <Button
          onClick={handleIngest}
          disabled={loading || !content.trim() || !uri.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Ingesting...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Ingest Knowledge
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Rocker Vault Upload
 * Upload files, links, or text to Rocker's permanent memory
 */

import { useState } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function RockerVaultUpload() {
  const [uploading, setUploading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [project, setProject] = useState('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setResult(null);

    try {
      const file = files[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('rocker_vault_documents')
        .insert({
          user_id: user.id,
          filename: file.name,
          content_type: file.type,
          size_bytes: file.size,
          storage_path: fileName,
          project: project || null,
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger processing (would call edge function in production)
      setResult({
        success: true,
        message: `📄 "${file.name}" uploaded to vault`,
        details: {
          size: `${(file.size / 1024).toFixed(1)} KB`,
          project: project || 'General',
          status: 'Processing chunks...'
        }
      });

      toast({
        title: "Upload Successful",
        description: `${file.name} is being processed by Rocker`
      });

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return;

    setUploading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Store as text document
      const blob = new Blob([textContent], { type: 'text/plain' });
      const fileName = `${user.id}/${Date.now()}_note.txt`;
      
      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('rocker_vault_documents')
        .insert({
          user_id: user.id,
          filename: 'Text Note',
          content_type: 'text/plain',
          size_bytes: blob.size,
          storage_path: fileName,
          project: project || null,
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      setResult({
        success: true,
        message: "✅ Text saved to vault",
        details: {
          words: textContent.split(/\s+/).length,
          project: project || 'General'
        }
      });

      setTextContent('');
      
      toast({
        title: "Saved to Vault",
        description: "Rocker is processing your note"
      });

    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLinkSubmit = async () => {
    if (!linkUrl.trim()) return;

    setUploading(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Store link reference
      const metadata = {
        url: linkUrl,
        type: 'link'
      };

      const { data, error } = await supabase
        .from('rocker_vault_documents')
        .insert({
          user_id: user.id,
          filename: linkUrl,
          content_type: 'text/uri-list',
          size_bytes: linkUrl.length,
          storage_path: `${user.id}/links/${Date.now()}.url`,
          metadata,
          project: project || null,
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      setResult({
        success: true,
        message: "🔗 Link saved to vault",
        details: {
          url: linkUrl,
          project: project || 'General'
        }
      });

      setLinkUrl('');

      toast({
        title: "Link Saved",
        description: "Rocker will analyze and file it"
      });

    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">Upload to Vault</h2>
        <p className="text-sm text-muted-foreground">
          Give Rocker permanent memory. Files, notes, and links will be chunked, embedded, and organized.
        </p>
      </div>

      <div className="mb-4">
        <Label htmlFor="project">Project/Category (optional)</Label>
        <Input
          id="project"
          placeholder="e.g., Marketing, Finances, Personal"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="mt-1"
        />
      </div>

      <Tabs defaultValue="file" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="file">
            <Upload className="h-4 w-4 mr-2" />
            File
          </TabsTrigger>
          <TabsTrigger value="text">
            <FileText className="h-4 w-4 mr-2" />
            Text
          </TabsTrigger>
          <TabsTrigger value="link">
            <LinkIcon className="h-4 w-4 mr-2" />
            Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                Drop files or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PDFs, docs, spreadsheets, images (max 50MB)
              </p>
            </label>
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Textarea
            placeholder="# Project: Marketing Q1&#10;&#10;Notes, bullet points, or paste text here...&#10;&#10;Rocker will organize, tag, and make it searchable."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <Button
            onClick={handleTextSubmit}
            disabled={uploading || !textContent.trim()}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save to Vault'
            )}
          </Button>
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
          <Input
            placeholder="https://docs.example.com/guide"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            type="url"
          />
          <p className="text-xs text-muted-foreground">
            Rocker will fetch, analyze, and file the content
          </p>
          <Button
            onClick={handleLinkSubmit}
            disabled={uploading || !linkUrl.trim()}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Add Link'
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {result && (
        <Card className="mt-4 p-4 bg-muted">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{result.message}</p>
              {result.details && (
                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </Card>
  );
}
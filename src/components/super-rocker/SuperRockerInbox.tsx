import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Star, 
  Archive, 
  Tag, 
  Edit2, 
  CheckSquare, 
  MoreVertical,
  FolderPlus,
  FileText,
  Copy,
  Check,
  Upload,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSession } from '@/lib/auth/context';

interface InboxFile {
  id: string;
  name: string;
  summary: string;
  category: string;
  tags: string[];
  starred: boolean;
  created_at: string;
}

const CATEGORIES = [
  'Projects', 'People', 'Finance', 'Legal', 
  'Marketing', 'Product', 'Personal', 'Notes'
];

export function SuperRockerInbox() {
  const { toast } = useToast();
  const { session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<InboxFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteSubject, setPasteSubject] = useState('');
  const [showPasteDialog, setShowPasteDialog] = useState(false);

  const loadInbox = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rocker_files')
        .select('id, name, summary, category, tags, starred, created_at')
        .eq('status', 'inbox')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Failed to load inbox:', error);
      toast({
        title: 'Failed to load inbox',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const toggleStar = async (id: string, currentStarred: boolean) => {
    try {
      const { error } = await supabase
        .from('rocker_files')
        .update({ starred: !currentStarred })
        .eq('id', id);

      if (error) throw error;
      await loadInbox();
    } catch (error: any) {
      toast({
        title: 'Failed to star',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fileItem = async (id: string, category: string) => {
    try {
      const folderPath = `${category}`;
      const { error } = await supabase
        .from('rocker_files')
        .update({ 
          status: 'filed',
          folder_path: folderPath
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: `Filed to ${category}` });
      await loadInbox();
    } catch (error: any) {
      toast({
        title: 'Failed to file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const bulkFile = async (category: string) => {
    if (selected.size === 0) return;

    try {
      const updates = Array.from(selected).map(id =>
        supabase
          .from('rocker_files')
          .update({ 
            status: 'filed',
            folder_path: category
          })
          .eq('id', id)
      );

      await Promise.all(updates);
      toast({ title: `Filed ${selected.size} items to ${category}` });
      setSelected(new Set());
      await loadInbox();
    } catch (error: any) {
      toast({
        title: 'Failed to file items',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!session?.userId) {
      toast({ title: 'Please log in to upload files', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const file = fileList[0];

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', session.userId);

      const { data, error } = await supabase.functions.invoke('rocker-process-file', {
        body: formData,
      });

      if (error) throw error;

      toast({ title: `${file.name} uploaded! ${data?.knowledge_chunks || 0} chunks indexed.` });
      await loadInbox();
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({ title: 'Failed to upload file', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBulkPaste = async () => {
    if (!pasteText.trim()) {
      toast({ title: 'Please paste some text', variant: 'destructive' });
      return;
    }

    setIsPasting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-ingest', {
        body: {
          text: pasteText.trim(),
          subject: pasteSubject || 'Bulk Paste',
        }
      });

      if (error || (data && (data as any).error)) {
        throw new Error((data as any)?.error || (error as any)?.message || 'Failed to ingest paste');
      }

      toast({ 
        title: `Filed to ${data.category}!`, 
        description: `${data.stored} chunks • Tags: ${data.tags?.slice(0, 3).join(', ') || 'none'}` 
      });
      setPasteText('');
      setPasteSubject('');
      setShowPasteDialog(false);
      await loadInbox();
    } catch (error: any) {
      console.error('Paste ingest error:', error);
      toast({ title: 'Failed to ingest paste', description: error.message, variant: 'destructive' });
    } finally {
      setIsPasting(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inbox</h2>
          <p className="text-sm text-muted-foreground">
            {files.length} items need organizing
          </p>
        </div>
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={isUploading}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload File
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPasteDialog(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Bulk Paste
          </Button>
          
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground self-center">
                {selected.size} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    File Selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {CATEGORIES.map(cat => (
                    <DropdownMenuItem key={cat} onClick={() => bulkFile(cat)}>
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {files.map((file) => (
            <Card 
              key={file.id} 
              className={`p-4 cursor-pointer transition-colors ${
                selected.has(file.id) ? 'border-primary bg-accent/50' : ''
              }`}
              onClick={() => toggleSelect(file.id)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(file.id)}
                  onChange={() => toggleSelect(file.id)}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold truncate">{file.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {file.summary || 'No summary available'}
                      </p>
                    </div>
                    
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(file.id, file.starred);
                        }}
                      >
                        <Star 
                          className={`h-4 w-4 ${file.starred ? 'fill-primary text-primary' : ''}`} 
                        />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {CATEGORIES.map(cat => (
                            <DropdownMenuItem 
                              key={cat} 
                              onClick={() => fileItem(file.id, cat)}
                            >
                              <FolderPlus className="h-4 w-4 mr-2" />
                              File to {cat}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {file.category}
                    </Badge>
                    {file.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {files.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inbox is empty!</p>
              <p className="text-sm mt-1">Upload files or paste notes to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bulk Paste Dialog */}
      <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Paste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title (optional)"
              value={pasteSubject}
              onChange={(e) => setPasteSubject(e.target.value)}
              disabled={isPasting}
            />
            <Textarea
              placeholder="Paste massive text here (up to 250k characters)..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              disabled={isPasting}
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPasteDialog(false)}
                disabled={isPasting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkPaste}
                disabled={isPasting || !pasteText.trim()}
              >
                {isPasting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Ingest & File'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Folder, 
  File, 
  Search, 
  Brain, 
  ChevronRight, 
  ChevronDown,
  Pin,
  Trash2,
  FolderPlus,
  Zap,
  RefreshCw,
  Edit,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface FileItem {
  id: string;
  name: string;
  project: string | null;
  category: string | null;
  folder_path: string | null;
  summary: string | null;
  status: string;
  tags: string[];
  created_at: string;
  chunk_count?: number;
}

interface Memory {
  id: string;
  kind: string;
  key: string;
  value: any;
  pinned: boolean;
  priority: number;
  created_at: string;
}

export function UnifiedFilesMemory() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['project:yalls.ai']));
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    loadFiles();
    loadMemories();
  }, []);

  const loadFiles = async () => {
    try {
      const { data: filesData, error } = await supabase
        .from('rocker_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const filesWithCounts = await Promise.all(
        (filesData || []).map(async (file: any) => {
          const { count } = await supabase
            .from('rocker_knowledge')
            .select('*', { count: 'exact', head: true })
            .eq('file_id', file.id);
          
          return { ...file, chunk_count: count || 0 };
        })
      );
      
      setFiles(filesWithCounts);
    } catch (error: any) {
      console.error('Failed to load files:', error);
    }
  };

  const loadMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('rocker_long_memory')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMemories(data as Memory[]);
    } catch (error: any) {
      console.error('Failed to load memories:', error);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const organizeAllFiles = async () => {
    setIsOrganizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-organize-all');
      if (error) throw error;
      toast({ title: 'Organization started', description: `Processing ${data?.queued || 'all'} files...` });
      setTimeout(() => loadFiles(), 3000);
    } catch (error: any) {
      toast({ title: 'Organization failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsOrganizing(false);
    }
  };

  const generateEmbeddings = async () => {
    setIsEmbedding(true);
    try {
      const { data, error } = await supabase.functions.invoke('andy-embed-knowledge');
      if (error) throw error;
      toast({ title: 'Embeddings Generated', description: `Processed ${data.processed} chunks.` });
    } catch (error: any) {
      toast({ title: 'Failed to generate embeddings', description: error.message, variant: 'destructive' });
    } finally {
      setIsEmbedding(false);
    }
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('rocker_long_memory')
        .update({ pinned: !currentPinned })
        .eq('id', id);
      if (error) throw error;
      await loadMemories();
      toast({ title: currentPinned ? 'Unpinned' : 'Pinned' });
    } catch (error: any) {
      toast({ title: 'Failed to toggle pin', description: error.message, variant: 'destructive' });
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const { error } = await supabase.from('rocker_long_memory').delete().eq('id', id);
      if (error) throw error;
      await loadMemories();
      toast({ title: 'Memory deleted' });
    } catch (error: any) {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      const { error } = await supabase.from('rocker_files').delete().eq('id', fileId);
      if (error) throw error;
      toast({ title: 'File deleted' });
      await loadFiles();
      setViewOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to delete file', description: error.message, variant: 'destructive' });
    }
  };

  const filteredFiles = files.filter(f => {
    if (!searchQuery) return true;
    return f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           f.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           f.project?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           f.tags?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredMemories = memories.filter(m => {
    if (!searchQuery) return true;
    const text = JSON.stringify(m.value).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const proj = file.project || 'Uncategorized';
    if (!acc[proj]) acc[proj] = {};
    const path = file.folder_path || file.category || 'Root';
    if (!acc[proj][path]) acc[proj][path] = [];
    acc[proj][path].push(file);
    return acc;
  }, {} as Record<string, Record<string, FileItem[]>>);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Files & Memory</h2>
          <p className="text-sm text-muted-foreground">
            {files.length} files • {memories.length} memories
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={organizeAllFiles} disabled={isOrganizing}>
            {isOrganizing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FolderPlus className="h-4 w-4 mr-2" />}
            Organize All
          </Button>
          <Button size="sm" variant="default" onClick={generateEmbeddings} disabled={isEmbedding}>
            {isEmbedding ? <Zap className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Embed All
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search everything..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files">
            <FileText className="h-4 w-4 mr-2" />
            Files ({filteredFiles.length})
          </TabsTrigger>
          <TabsTrigger value="memories">
            <Brain className="h-4 w-4 mr-2" />
            Memories ({filteredMemories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 pr-4">
              {Object.entries(groupedFiles).map(([project, paths]) => {
                const projectKey = `project:${project}`;
                const isProjectExpanded = expandedFolders.has(projectKey);
                
                return (
                  <div key={project} className="space-y-1">
                    <button
                      onClick={() => toggleFolder(projectKey)}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                    >
                      {isProjectExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <Folder className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold">{project}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {Object.values(paths).flat().length} items
                      </span>
                    </button>
                    
                    {isProjectExpanded && (
                      <div className="ml-6 space-y-1">
                        {Object.entries(paths).map(([folderPath, folderFiles]) => {
                          const folderKey = `${projectKey}/${folderPath}`;
                          const isFolderExpanded = expandedFolders.has(folderKey);
                          
                          return (
                            <div key={folderPath}>
                              <button
                                onClick={() => toggleFolder(folderKey)}
                                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                              >
                                {isFolderExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <Folder className="h-4 w-4 text-amber-500" />
                                <span className="text-sm">{folderPath}</span>
                                <span className="ml-auto text-xs text-muted-foreground">{folderFiles.length}</span>
                              </button>
                              
                              {isFolderExpanded && (
                                <div className="ml-6 space-y-1">
                                  {folderFiles.map(file => (
                                    <button
                                      key={file.id}
                                      onClick={() => { setSelectedFile(file); setViewOpen(true); }}
                                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent transition-colors text-left"
                                    >
                                      <File className="h-4 w-4 text-muted-foreground" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{file.name}</p>
                                        {file.summary && (
                                          <p className="text-xs text-muted-foreground truncate">{file.summary}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        {file.chunk_count! > 0 && (
                                          <Badge variant="secondary" className="text-xs">{file.chunk_count}</Badge>
                                        )}
                                        {file.tags?.slice(0, 2).map(tag => (
                                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                        ))}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="memories" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 pr-4">
              {filteredMemories.map(mem => (
                <div key={mem.id} className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{mem.kind}</Badge>
                        {mem.pinned && <Pin className="h-3 w-3 text-primary" />}
                        {mem.key && <span className="text-xs text-muted-foreground truncate">{mem.key}</span>}
                      </div>
                      <p className="text-sm line-clamp-2">
                        {mem.value?.text || JSON.stringify(mem.value).slice(0, 100)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => togglePin(mem.id, mem.pinned)}>
                        <Pin className={`h-4 w-4 ${mem.pinned ? 'text-primary' : ''}`} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMemory(mem.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* File Viewer Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge>{selectedFile.category}</Badge>
                <Badge variant="outline">{selectedFile.project || 'No project'}</Badge>
                {selectedFile.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              {selectedFile.summary && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Summary</h4>
                  <p className="text-sm text-muted-foreground">{selectedFile.summary}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Created {format(new Date(selectedFile.created_at), 'PPp')}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => deleteFile(selectedFile.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

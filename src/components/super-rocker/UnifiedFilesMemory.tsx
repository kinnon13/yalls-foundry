import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessengerRail } from './MessengerRail';
import { ConceptMind } from './ConceptMind';
import { AndyResearch } from './AndyResearch';
import { ThreeMemorySystems } from './ThreeMemorySystems';
import { PredictionGame } from './PredictionGame';
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
  FileText,
  Database,
  MessageSquare,
  Plus,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AndyResearch } from './AndyResearch';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  category_type: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

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
  file_type?: string;
  category_id?: string | null;
}

interface Memory {
  id: string;
  kind: string;
  key: string;
  value: any;
  pinned: boolean;
  priority: number;
  created_at: string;
  memory_layer?: string | null;
}

interface KnowledgeChunk {
  id: string;
  content: string;
  chunk_index: number;
  file_id: string | null;
  message_id: number | null;
  keywords: string[] | null;
  chunk_summary: string | null;
  created_at: string;
}

interface ChatMessage {
  id: number;
  content: string;
  role: string;
  created_at: string;
  exported_to_file_id: string | null;
}

export function UnifiedFilesMemory() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['layer:Business']));
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);

  useEffect(() => {
    loadCategories();
    loadFiles();
    loadMemories();
    loadKnowledge();
    loadChatMessages();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('rocker_categories')
        .select('*')
        .order('category_type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
    }
  };

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
        .limit(200);

      if (error) throw error;
      setMemories(data as Memory[]);
    } catch (error: any) {
      console.error('Failed to load memories:', error);
    }
  };

  const loadKnowledge = async () => {
    try {
      const { data, error } = await supabase
        .from('rocker_knowledge')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setKnowledgeChunks(data || []);
    } catch (error: any) {
      console.error('Failed to load knowledge:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('rocker_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setChatMessages(data || []);
    } catch (error: any) {
      console.error('Failed to load chat messages:', error);
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
    return text.includes(searchQuery.toLowerCase()) || 
           m.memory_layer?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredKnowledge = knowledgeChunks.filter(k => {
    if (!searchQuery) return true;
    return k.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           k.keywords?.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredMessages = chatMessages.filter(m => {
    if (!searchQuery) return true;
    return m.content?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const { data, error } = await supabase.rpc('rocker_create_category', {
        p_name: newCategoryName,
        p_category_type: 'custom'
      });
      
      if (error) throw error;
      toast({ title: 'Category created!', description: `"${newCategoryName}" is now available` });
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
      await loadCategories();
    } catch (error: any) {
      toast({ title: 'Failed to create category', description: error.message, variant: 'destructive' });
    }
  };

  const groupedByMemoryLayer = filteredMemories.reduce((acc, mem) => {
    const layer = mem.memory_layer || 'Uncategorized';
    if (!acc[layer]) acc[layer] = [];
    acc[layer].push(mem);
    return acc;
  }, {} as Record<string, Memory[]>);

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
          <h2 className="text-2xl font-semibold">Memory & Knowledge System</h2>
          <p className="text-sm text-muted-foreground">
            {files.length} files • {memories.length} memories • {knowledgeChunks.length} knowledge chunks • {chatMessages.length} messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowNewCategoryDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            <Database className="h-4 w-4 mr-2" />
            All Memory & Files
          </TabsTrigger>
          <TabsTrigger value="split">
            <Brain className="h-4 w-4 mr-2" />
            3 Memory Systems
          </TabsTrigger>
          <TabsTrigger value="andy">
            <Brain className="h-4 w-4 mr-2" />
            Andy's Brain
          </TabsTrigger>
          <TabsTrigger value="game">
            <Target className="h-4 w-4 mr-2" />
            Prediction Game
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search everything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="text-xs text-muted-foreground mb-4">
            Everything is one unified knowledge system - files, memories, chats, and embedded knowledge chunks all interconnected
          </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-6 pr-4">
          {/* Dynamic Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Categories ({categories.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map(cat => (
                  <div key={cat.id} className="p-2 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon || '📁'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{cat.category_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memory Layers */}
          {Object.keys(groupedByMemoryLayer).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Memory by Layer ({filteredMemories.length})
              </h3>
              <div className="space-y-2">
                {Object.entries(groupedByMemoryLayer).map(([layer, layerMemories]) => {
                  const layerKey = `layer:${layer}`;
                  const isExpanded = expandedFolders.has(layerKey);
                  
                  return (
                    <div key={layer}>
                      <button
                        onClick={() => toggleFolder(layerKey)}
                        className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span className="font-medium text-sm">{layer}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{layerMemories.length}</span>
                      </button>
                      
                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {layerMemories.map(mem => (
                            <div key={mem.id} className="p-2 border rounded-lg bg-card hover:bg-accent/50 transition-colors text-sm">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <Badge variant="secondary" className="text-xs">{mem.kind}</Badge>
                                    {mem.pinned && <Pin className="h-3 w-3 text-primary" />}
                                  </div>
                                  <p className="text-xs line-clamp-2">
                                    {mem.value?.text || JSON.stringify(mem.value).slice(0, 100)}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => togglePin(mem.id, mem.pinned)}>
                                    <Pin className={`h-3 w-3 ${mem.pinned ? 'text-primary' : ''}`} />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteMemory(mem.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files by Project */}
          {Object.keys(groupedFiles).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Files by Project ({filteredFiles.length})
              </h3>
              <div className="space-y-1">
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
            </div>
          )}

          {/* Knowledge Chunks */}
          {filteredKnowledge.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Knowledge Chunks ({filteredKnowledge.length})
              </h3>
              <div className="space-y-2">
                {filteredKnowledge.map(chunk => (
                  <div key={chunk.id} className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 mt-1 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">Chunk {chunk.chunk_index}</Badge>
                          {chunk.keywords && chunk.keywords.slice(0, 3).map(kw => (
                            <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                        {chunk.chunk_summary && (
                          <p className="text-xs text-muted-foreground mb-1">{chunk.chunk_summary}</p>
                        )}
                        <p className="text-sm line-clamp-3">{chunk.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(chunk.created_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {filteredMessages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat Messages ({filteredMessages.length})
              </h3>
              <div className="space-y-2">
                {filteredMessages.slice(0, 30).map(msg => (
                  <div key={msg.id} className="p-2 border rounded-lg bg-card hover:bg-accent/50 transition-colors text-xs">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Badge variant={msg.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                            {msg.role}
                          </Badge>
                        </div>
                        <p className="text-xs line-clamp-2">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredMessages.length > 30 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Showing 30 of {filteredMessages.length} messages
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
        </TabsContent>

        <TabsContent value="split" className="mt-4">
          <ThreeMemorySystems />
        </TabsContent>

        <TabsContent value="andy" className="mt-4">
          <AndyResearch />
        </TabsContent>

        <TabsContent value="game" className="mt-4">
          <PredictionGame />
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

      {/* New Category Dialog */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Category name (e.g., 'Investments', 'Health', 'Travel')"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createCategory} disabled={!newCategoryName.trim()}>
                Create Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

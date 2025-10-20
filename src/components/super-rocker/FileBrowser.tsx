import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, File, Search, Edit, Trash2, FolderPlus, MoveHorizontal, RefreshCw, FileSearch, FileText, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { FilingAnalysisViewer } from './FilingAnalysisViewer';

interface FileItem {
  id: string;
  name: string;
  project: string | null;
  category: string | null;
  folder_path: string | null;
  summary: string | null;
  status: string;
  tags: string[];
  starred: boolean;
  source: string | null;
  created_at: string;
  text_content?: string | null;
  ocr_text?: string | null;
}

export function FileBrowser() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: '', project: '', category: '', folder_path: '', summary: '' });
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [analysisFileId, setAnalysisFileId] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [viewFile, setViewFile] = useState<FileItem | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('rocker_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Failed to load files:', error);
    }
  };

  const categories = Array.from(new Set(files.map(f => f.category))).filter(Boolean);
  const projects = Array.from(new Set(files.map(f => f.project))).filter(Boolean);
  
  const filteredFiles = files.filter(f => {
    const matchesSearch = !searchQuery || 
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.project?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.folder_path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesProject = selectedProject === 'all' || f.project === selectedProject;
    
    return matchesSearch && matchesCategory && matchesProject;
  });

  // Group files by PROJECT first, then full folder path
  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const proj = file.project || 'Uncategorized';
    if (!acc[proj]) acc[proj] = {};
    
    const path = file.folder_path || `${file.category || 'Root'}`;
    if (!acc[proj][path]) acc[proj][path] = [];
    acc[proj][path].push(file);
    
    return acc;
  }, {} as Record<string, Record<string, FileItem[]>>);

  const handleEdit = (file: FileItem) => {
    setSelectedFile(file);
    setEditData({
      name: file.name || '',
      project: file.project || '',
      category: file.category || '',
      folder_path: file.folder_path || '',
      summary: file.summary || ''
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!selectedFile) return;

    try {
      const { error } = await supabase
        .from('rocker_files')
        .update({
          name: editData.name,
          project: editData.project || null,
          category: editData.category,
          folder_path: editData.folder_path || null,
          summary: editData.summary
        })
        .eq('id', selectedFile.id);

      if (error) throw error;

      toast({ title: 'File updated' });
      setEditMode(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (error: any) {
      toast({
        title: 'Failed to update file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Delete this file? This will also delete associated knowledge chunks.')) return;

    try {
      const { error } = await supabase
        .from('rocker_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({ title: 'File deleted' });
      await loadFiles();
    } catch (error: any) {
      toast({
        title: 'Failed to delete file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const reprocessAll = async () => {
    setIsReprocessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-reprocess-all');

      if (error) throw error;

      toast({
        title: 'Re-organization complete',
        description: `Processed ${data.processed} of ${data.total} files with updated project-based filing.`,
      });

      await loadFiles();
    } catch (error: any) {
      toast({
        title: 'Re-processing failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={reprocessAll}
          disabled={isReprocessing}
          variant="outline"
          size="sm"
        >
          {isReprocessing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Re-organizing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-organize All
            </>
          )}
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files, projects, keywords, content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(proj => (
              <SelectItem key={proj} value={proj}>{proj}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-6 pr-4">
          {Object.entries(groupedFiles).map(([project, paths]) => (
            <div key={project} className="space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-primary">
                <Folder className="h-5 w-5" />
                {project}
              </div>
              
              {Object.entries(paths).map(([fullPath, items]) => {
                const pathSegments = fullPath.split('/').filter(Boolean);
                const indent = pathSegments.length * 4;
                
                return (
                  <div key={fullPath} className="space-y-2" style={{ marginLeft: `${indent}px` }}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <FolderPlus className="h-3 w-3" />
                      {fullPath}
                    </div>
                    
                    {items.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-start gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <File className="h-4 w-4 mt-1 text-primary shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{file.name}</p>
                              {file.summary && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {file.summary}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {file.tags?.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                <Badge variant="outline" className="text-xs">
                                  {file.status}
                                </Badge>
                                {file.starred && (
                                  <Badge variant="default" className="text-xs">★</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(file.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setViewFile(file);
                                  setViewOpen(true);
                                }}
                                title="View full text"
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setAnalysisFileId(file.id);
                                  setShowAnalysis(true);
                                }}
                                title="View sentence-level analysis"
                              >
                                <FileSearch className="h-3 w-3" />
                              </Button>
                              <Dialog open={editMode && selectedFile?.id === file.id} onOpenChange={(open) => {
                                if (!open) {
                                  setEditMode(false);
                                  setSelectedFile(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleEdit(file)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit File</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Name</label>
                                      <Input
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Project</label>
                                      <Input
                                        value={editData.project}
                                        onChange={(e) => setEditData({ ...editData, project: e.target.value })}
                                        placeholder="e.g., AgTech Platform, Q1 Marketing"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Category</label>
                                      <Input
                                        value={editData.category}
                                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                        placeholder="e.g., Development, Marketing, Finance"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Full Folder Path</label>
                                      <Input
                                        value={editData.folder_path}
                                        onChange={(e) => setEditData({ ...editData, folder_path: e.target.value })}
                                        placeholder="e.g., ProjectName/Phase 1/Backend/API Design"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Use slashes (/) for deep nesting: Project/Phase/Category/Sub
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Summary</label>
                                      <Textarea
                                        value={editData.summary}
                                        onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="outline" onClick={() => {
                                        setEditMode(false);
                                        setSelectedFile(null);
                                      }}>
                                        Cancel
                                      </Button>
                                      <Button onClick={saveEdit}>
                                        Save Changes
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => deleteFile(file.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                );
              })}
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No files found</p>
              <p className="text-xs mt-1">Upload content to start filing</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <FilingAnalysisViewer
        fileId={analysisFileId || ''}
        open={showAnalysis}
        onClose={() => {
          setShowAnalysis(false);
          setAnalysisFileId(null);
        }}
      />

      <Dialog open={viewOpen} onOpenChange={(open) => setViewOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Full Text: {viewFile?.name || 'Untitled'}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const full = viewFile?.text_content || viewFile?.ocr_text || '';
                  if (!full) return;
                  await navigator.clipboard.writeText(full);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied' : 'Copy All'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <pre className="whitespace-pre-wrap text-sm font-mono leading-6">
              {viewFile?.text_content || viewFile?.ocr_text || 'No text content available'}
            </pre>
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


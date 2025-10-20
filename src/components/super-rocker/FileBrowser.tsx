import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, File, Search, Edit, Trash2, FolderPlus, MoveHorizontal, RefreshCw, FileSearch, FileText, Copy, Check, Brain, ChevronRight, ChevronDown } from 'lucide-react';
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
  thread_id?: string | null;
  chunk_count?: number; // Add chunk count to display
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoBackfillDone, setAutoBackfillDone] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedFile, setDraggedFile] = useState<FileItem | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      // Load files with chunk count using file_id FK
      const { data: filesData, error } = await supabase
        .from('rocker_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // For each file, count its chunks via file_id
      const filesWithCounts = await Promise.all(
        (filesData || []).map(async (file: any) => {
          const { count } = await supabase
            .from('rocker_knowledge')
            .select('*', { count: 'exact', head: true })
            .eq('file_id', file.id);
          
          return {
            ...file,
            chunk_count: count || 0
          };
        })
      );
      
      setFiles(filesWithCounts);
      // Auto-expand main project for convenience
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add('project:yalls.ai');
        return next;
      });
    } catch (error: any) {
      console.error('Failed to load files:', error);
    }
  };
  const ensureBackfill = async () => {
    if (autoBackfillDone) return;
    try {
      const now = new Date();
      const yStart = new Date(now);
      yStart.setDate(now.getDate() - 1);
      yStart.setHours(0, 0, 0, 0);
      const yEnd = new Date(now);
      yEnd.setDate(now.getDate() - 1);
      yEnd.setHours(23, 59, 59, 999);

      const anyYesterday = files.some((f) => {
        const d = new Date(f.created_at);
        return d >= yStart && d <= yEnd;
      });

      if (!anyYesterday) {
        const { data, error } = await supabase.functions.invoke('rocker-reprocess-all');
        if (error) throw error;
        toast({ title: 'Backfilled missing files', description: `Reprocessed ${data?.processed ?? 'recent'} items.` });
        await loadFiles();
      }
    } catch (e: any) {
      console.warn('Auto backfill failed:', e.message || e);
    } finally {
      setAutoBackfillDone(true);
    }
  };

  useEffect(() => {
    if (!autoBackfillDone) {
      ensureBackfill();
    }
  }, [files]);

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

  const organizeAllFiles = async () => {
    setIsOrganizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-organize-all');
      if (error) throw error;
      toast({ 
        title: 'Organization started', 
        description: `Processing ${data?.queued || 'all'} files...` 
      });
      setTimeout(() => loadFiles(), 3000);
    } catch (error: any) {
      toast({ 
        title: 'Organization failed', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleDragStart = (file: FileItem) => {
    setDraggedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetProject: string, targetPath: string) => {
    if (!draggedFile) return;
    
    try {
      const { error } = await supabase
        .from('rocker_files')
        .update({
          project: targetProject,
          folder_path: targetPath
        })
        .eq('id', draggedFile.id);

      if (error) throw error;

      toast({ title: `Moved to ${targetProject}/${targetPath}` });
      await loadFiles();
    } catch (error: any) {
      toast({ title: 'Move failed', description: error.message, variant: 'destructive' });
    } finally {
      setDraggedFile(null);
    }
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

  const runDeepAnalysisAll = async () => {
    setIsAnalyzing(true);
    try {
      // Get all files with text content that don't have deep analysis yet
      const filesToAnalyze = files.filter(f => 
        (f.text_content || f.ocr_text) && 
        (f.text_content || f.ocr_text)!.length > 200
      );

      if (filesToAnalyze.length === 0) {
        toast({ title: 'No files to analyze', description: 'All files either lack text content or are already analyzed.' });
        return;
      }

      toast({ 
        title: 'Starting deep analysis', 
        description: `Analyzing ${filesToAnalyze.length} files with sentence-level precision...` 
      });

      // Trigger analysis for each file (async, non-blocking)
      let queued = 0;
      for (const file of filesToAnalyze) {
        const content = file.text_content || file.ocr_text || '';
        supabase.functions.invoke('rocker-deep-analyze', {
          body: { 
            content, 
            thread_id: file.thread_id, 
            file_id: file.id 
          }
        }).then(() => {
          console.log('[DeepAnalysis] Queued for:', file.name);
        }).catch(err => {
          console.error('[DeepAnalysis] Failed to queue:', file.name, err);
        });
        queued++;
      }

      toast({ 
        title: 'Analysis running', 
        description: `${queued} files queued for deep analysis. Results will appear in 30-60 seconds.`,
      });

    } catch (error: any) {
      toast({
        title: 'Failed to start analysis',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={runDeepAnalysisAll}
          disabled={isAnalyzing}
          variant="default"
          size="sm"
        >
          {isAnalyzing ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Deep Analysis All
            </>
          )}
        </Button>
        <Button
          onClick={async () => {
            if (!confirm('Consolidate all files under "yalls.ai" root? This will update project names.')) return;
            try {
              const { data, error } = await supabase
                .from('rocker_files')
                .update({ project: 'yalls.ai' })
                .neq('project', 'yalls.ai')
                .select();
              if (error) throw error;
              toast({ title: 'Consolidated!', description: `Updated ${data?.length || 0} files under yalls.ai root.` });
              await loadFiles();
            } catch (e: any) {
              toast({ title: 'Failed', description: e.message, variant: 'destructive' });
            }
          }}
          variant="outline"
          size="sm"
        >
          <Folder className="h-4 w-4 mr-2" />
          Consolidate → yalls.ai
        </Button>
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
        <Button
          onClick={organizeAllFiles}
          disabled={isOrganizing}
          variant="outline"
          size="sm"
        >
          {isOrganizing ? (
            <>
              <FolderPlus className="h-4 w-4 mr-2 animate-spin" />
              Organizing...
            </>
          ) : (
            <>
              <FolderPlus className="h-4 w-4 mr-2" />
              Organize All Files
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
        <div className="space-y-2 pr-4">
          {Object.entries(groupedFiles).map(([project, paths]) => {
            const projectKey = `project:${project}`;
            const isProjectExpanded = expandedFolders.has(projectKey);
            
            return (
              <div key={project} className="space-y-1">
                <button
                  onClick={() => toggleFolder(projectKey)}
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                >
                  {isProjectExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-2">
                    <Folder className="h-6 w-6 text-blue-500" />
                    <span className="font-semibold text-base">{project}</span>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {Object.values(paths).flat().length} items
                  </span>
                </button>
                
                {isProjectExpanded && (
                  <div className="ml-6 space-y-1 border-l-2 border-accent/30 pl-2">
                    {Object.entries(paths).map(([fullPath, items]) => {
                      const folderKey = `${projectKey}:${fullPath}`;
                      const isFolderExpanded = expandedFolders.has(folderKey);
                      const pathSegments = fullPath.split('/').filter(Boolean);
                      const folderName = pathSegments[pathSegments.length - 1] || fullPath;
                      
                      return (
                        <div key={fullPath} className="space-y-1">
                          <button
                            onClick={() => toggleFolder(folderKey)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDrop(project, fullPath);
                            }}
                            className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                          >
                            {isFolderExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                            <Folder className="h-5 w-5 text-blue-400" />
                            <span className="text-sm font-medium">{folderName}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {items.length} files
                            </span>
                          </button>
                          
                          {isFolderExpanded && (
                            <div className="ml-6 space-y-1">
                               {items.map((file) => (
                                 <div
                                   key={file.id}
                                   draggable
                                   onDragStart={() => handleDragStart(file)}
                                   className="flex items-start gap-2 p-2 border rounded-lg hover:bg-accent/50 transition-colors cursor-move"
                                 >
                                   <File className="h-4 w-4 mt-1 text-gray-600 shrink-0" />
                                   
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
                                           {file.chunk_count && file.chunk_count > 0 && (
                                             <Badge variant="outline" className="text-xs">
                                               {file.chunk_count} chunks
                                             </Badge>
                                           )}
                                           {file.starred && (
                                             <Badge variant="default" className="text-xs">★</Badge>
                                           )}
                                         </div>
                                         <p className="text-xs text-muted-foreground mt-1">
                                           {format(new Date(file.created_at), 'MMM d, yyyy h:mm:ss a')}
                                           {file.source && ` • from ${file.source}`}
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
                           )}
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
             );
           })}

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


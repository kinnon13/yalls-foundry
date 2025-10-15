import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Image, Video, FileText, Sparkles } from 'lucide-react';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { EntityPreviewCard } from '@/components/EntityPreviewCard';

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MediaUploadDialog = ({ open, onOpenChange }: MediaUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [context, setContext] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'team'>('private');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const { uploading, progress, uploadMedia } = useMediaUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    const result = await uploadMedia({
      file,
      caption,
      visibility,
      context,
    });

    if (result?.ai_analysis) {
      setAnalysisResult(result.ai_analysis);
    } else {
      // Close dialog after successful upload
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCaption('');
    setContext('');
    setVisibility('private');
    setAnalysisResult(null);
    onOpenChange(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-8 h-8" />;
    if (file.type.startsWith('video/')) return <Video className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Upload with Rocker
          </DialogTitle>
          <DialogDescription>
            Rocker will analyze your upload and help you organize it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Drop your file here...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">Drag & drop a file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports images, videos, and documents
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Remove
                </Button>
              </div>

              {/* Context Input */}
              <div className="space-y-2">
                <Label htmlFor="context">Context (optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Help Rocker understand... e.g., 'This is my horse Fight a Good Fight at the Fort Worth Classic'"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  disabled={uploading}
                  rows={2}
                />
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={uploading}
                  rows={3}
                />
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label>Visibility</Label>
                <RadioGroup value={visibility} onValueChange={(v: any) => setVisibility(v)} disabled={uploading}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="font-normal cursor-pointer">
                      Private (only you)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="team" id="team" />
                    <Label htmlFor="team" className="font-normal cursor-pointer">
                      Team (your organization)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="font-normal cursor-pointer">
                      Public (everyone)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading and analyzing...
                  </p>
                </div>
              )}

              {/* AI Analysis Results */}
              {analysisResult && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Rocker's Analysis</h3>
                  </div>
                  
                  {analysisResult.scene && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Scene</Label>
                      <p className="text-sm">{analysisResult.scene}</p>
                    </div>
                  )}

                  {analysisResult.entities && analysisResult.entities.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Detected Entities</Label>
                      <div className="space-y-2 mt-2">
                        {analysisResult.entities.map((entity: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{entity.name} ({entity.type})</span>
                            <span className="text-muted-foreground">
                              {(entity.confidence * 100).toFixed(0)}% confident
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button onClick={handleClose} className="w-full">
                    Done
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              {!uploading && !analysisResult && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} className="flex-1">
                    Upload & Analyze
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

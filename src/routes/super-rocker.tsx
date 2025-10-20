import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Loader2, Upload, Brain, CheckSquare, FileText } from 'lucide-react';
import { SuperRockerMemory } from '@/components/super-rocker/SuperRockerMemory';
import { SuperRockerTasks } from '@/components/super-rocker/SuperRockerTasks';
import { SuperRockerChat } from '@/components/super-rocker/SuperRockerChat';
import { SuperRockerInbox } from '@/components/super-rocker/SuperRockerInbox';
import { SuperRockerLibrary } from '@/components/super-rocker/SuperRockerLibrary';
import { SuperRockerVault } from '@/components/super-rocker/SuperRockerVault';

export default function SuperRocker() {
  const { session } = useSession();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const handleIngest = async () => {
    if (!text.trim()) {
      toast({ title: 'Please enter some text', variant: 'destructive' });
      return;
    }

    setIsIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-ingest', {
        body: {
          text: text.trim(),
          subject: subject || 'Super Rocker Memory',
          thread_id: threadId
        }
      });

      if (error) throw error;

      setThreadId(data.thread_id);
      toast({
        title: `Filed to ${data.category}!`,
        description: `${data.stored} chunks • Tags: ${data.tags?.slice(0, 3).join(', ') || 'none'} • ${data.summary?.slice(0, 50) || ''}`,
      });
      setText('');
      setSubject('');
    } catch (error: any) {
      console.error('Ingest error:', error);
      toast({
        title: 'Failed to add memory',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      setText(clipText);
      toast({ title: 'Pasted from clipboard' });
    } catch (err) {
      toast({ title: 'Could not read clipboard', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const { error } = await supabase.functions.invoke('ingest-upload', {
          body: formData,
        });

        if (error) throw error;
      }

      toast({
        title: 'Files uploaded!',
        description: `${files.length} file(s) added to Inbox for organization.`,
      });
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Failed to upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Super Rocker
            </h1>
            <p className="text-muted-foreground mt-1">
              Mass upload, organize, recall, and act on everything
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Inbox */}
          <Card className="p-6">
            <SuperRockerInbox />
          </Card>

          {/* Center: Vault & Quick Add */}
          <Card className="p-6 space-y-6">
            <SuperRockerVault />
          </Card>

          {/* Right: Library */}
          <Card className="p-6">
            <SuperRockerLibrary />
          </Card>
        </div>

        {/* Bottom Row: Chat & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <SuperRockerChat threadId={threadId} />
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Tasks</h2>
            </div>
            <SuperRockerTasks threadId={threadId} />
          </Card>
        </div>
      </div>
    </div>
  );
}
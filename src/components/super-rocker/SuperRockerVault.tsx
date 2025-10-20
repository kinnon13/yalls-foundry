/**
 * Super Rocker Vault
 * Bulk ingestion interface with paste, upload, Drive connection
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, Link2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuperRockerVaultProps {
  threadId: string | null;
  onThreadCreated: (threadId: string) => void;
}

export function SuperRockerVault({ threadId, onThreadCreated }: SuperRockerVaultProps) {
  const [pasteText, setPasteText] = useState("");
  const [pasteSubject, setPasteSubject] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  const handleBulkPaste = async () => {
    if (!pasteText.trim()) {
      toast.error("Please paste some text");
      return;
    }

    setIsIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rocker-ingest', {
        body: {
          text: pasteText.trim(),
          subject: pasteSubject || 'Bulk Paste',
          thread_id: threadId
        }
      });

      if (error) throw error;

      if (data?.thread_id && !threadId) {
        onThreadCreated(data.thread_id);
      }

      toast.success(
        `Filed to ${data.category}! ${data.stored} chunks • Tags: ${data.tags?.slice(0, 3).join(', ') || 'none'}`
      );
      setPasteText("");
      setPasteSubject("");
    } catch (error: any) {
      console.error("Paste ingest error:", error);
      toast.error(error.message || "Failed to ingest paste");
    } finally {
      setIsIngesting(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPasteText(text);
      toast.success("Pasted from clipboard");
    } catch (error) {
      toast.error("Failed to read clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vault</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            Connect Drive
          </Button>
        </div>
      </div>

      {/* Bulk Paste */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bulk Paste
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePasteFromClipboard}
          >
            Paste from Clipboard
          </Button>
        </div>

        <Input
          placeholder="Title (optional)"
          value={pasteSubject}
          onChange={(e) => setPasteSubject(e.target.value)}
        />

        <Textarea
          placeholder="Paste massive text here (up to 250k characters)..."
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
        />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{pasteText.length.toLocaleString()} characters</span>
          <Button
            onClick={handleBulkPaste}
            disabled={isIngesting || !pasteText.trim()}
          >
            {isIngesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add to Memory & Organize
          </Button>
        </div>
      </Card>

      {/* Upload Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Files
        </h3>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag & drop .docx, .pdf, .txt, .md, or images
          </p>
          <Button variant="outline" size="sm">
            Choose Files
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Docs in Vault</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Drive Files</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Memory Items</div>
        </Card>
      </div>
    </div>
  );
}

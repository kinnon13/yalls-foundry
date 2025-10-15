import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Link as LinkIcon } from 'lucide-react';
import { GoogleDriveButton } from './GoogleDriveButton';

interface ComposerProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onFileUpload: (fileName: string) => void;
  onUrlAnalyze: (url: string) => void;
}

export function Composer({ onSend, isLoading, onFileUpload, onUrlAnalyze }: ComposerProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    onSend(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,application/pdf,.csv,.txt,.doc,.docx';
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        onFileUpload(file.name);
      }
    };
    fileInput.click();
  };

  const handleUrlClick = () => {
    const url = prompt('Enter website URL to analyze:');
    if (url) {
      onUrlAnalyze(url);
    }
  };

  return (
    <div className="p-4 border-t border-border">
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleFileClick}
              title="Upload file (image, PDF, CSV, document)"
            >
              <Paperclip className="h-4 w-4 mr-1" />
              File
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUrlClick}
              title="Fetch and analyze website URL"
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              URL
            </Button>
            <GoogleDriveButton />
          </div>
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Rocker anything..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

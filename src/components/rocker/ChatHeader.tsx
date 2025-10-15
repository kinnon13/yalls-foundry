import { Button } from '@/components/ui/button';
import { Menu, X, Minus, Trash2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  isVoiceMode: boolean;
  isAlwaysListening: boolean;
  voiceStatus: 'connected' | 'connecting' | 'disconnected';
  onToggleVoiceMode: () => void;
  onToggleAlwaysListening: () => void;
  onClearMessages: () => void;
  onMinimize: () => void;
  onClose: () => void;
  hasMessages: boolean;
  isLoading: boolean;
}

export function ChatHeader({
  showSidebar,
  onToggleSidebar,
  isVoiceMode,
  isAlwaysListening,
  voiceStatus,
  onToggleVoiceMode,
  onToggleAlwaysListening,
  onClearMessages,
  onMinimize,
  onClose,
  hasMessages,
  isLoading
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <img 
          src={new URL('@/assets/rocker-cowboy-avatar.jpeg', import.meta.url).href} 
          alt="Rocker" 
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold">Rocker</h3>
          <p className="text-xs text-muted-foreground">Your AI sidekick</p>
        </div>
        {isVoiceMode && (
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            voiceStatus === 'connected' && "bg-green-500/20 text-green-700 dark:text-green-400",
            voiceStatus === 'connecting' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
            voiceStatus === 'disconnected' && "bg-gray-500/20 text-gray-700 dark:text-gray-400"
          )}>
            {voiceStatus === 'connected' ? '🎤 Listening' : voiceStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant={isAlwaysListening ? "default" : "ghost"}
          size="icon"
          onClick={onToggleAlwaysListening}
          disabled={isLoading}
          title={isAlwaysListening ? "Disable always listening" : "Enable always listening"}
          className={cn(isAlwaysListening && "animate-pulse")}
        >
          <Mic className="h-4 w-4" />
        </Button>
        {!isAlwaysListening && (
          <Button
            variant={isVoiceMode ? "default" : "ghost"}
            size="icon"
            onClick={onToggleVoiceMode}
            disabled={isLoading}
            title={isVoiceMode ? "Stop voice mode" : "Start voice mode"}
          >
            {isVoiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        {hasMessages && !isVoiceMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearMessages}
            disabled={isLoading}
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMinimize}
          title="Minimize"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

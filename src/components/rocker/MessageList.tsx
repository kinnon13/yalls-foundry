import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RockerMessageActions } from './RockerMessageActions';
import { AI_PROFILES, AIRole } from '@/lib/ai/rocker/config';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    url?: string;
  };
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isVoiceMode: boolean;
  voiceStatus: 'connected' | 'connecting' | 'disconnected';
  voiceTranscript: string;
  isAlwaysListening: boolean;
  actorRole?: AIRole;
}

export function MessageList({
  messages,
  isLoading,
  isVoiceMode,
  voiceStatus,
  voiceTranscript,
  isAlwaysListening,
  actorRole
}: MessageListProps) {
  const aiProfile = AI_PROFILES[actorRole || 'user'];
  return (
    <div className="space-y-4">
      {isVoiceMode && (
        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border border-border">
          <div className={cn(
            "mb-2 transition-all",
            voiceStatus === 'connected' && "scale-110 animate-pulse"
          )}>
            <img 
              src={new URL('@/assets/rocker-cowboy-avatar.jpeg', import.meta.url).href}
              alt={`${aiProfile.name} listening`}
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          <p className="text-xs font-semibold">
            {voiceStatus === 'connected' ? '🎤 Listening...' : 'Connecting...'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAlwaysListening 
              ? `Say "Hey ${aiProfile.name}" or type below`
              : 'Speak or type your message'}
          </p>
          {voiceTranscript && (
            <div className="mt-2 bg-background rounded-lg p-2 w-full">
              <p className="text-xs text-muted-foreground italic">"{voiceTranscript}"</p>
            </div>
          )}
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            'flex gap-3 group',
            message.role === 'user' ? 'justify-end' : 
            message.role === 'system' ? 'justify-center' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={new URL('@/assets/rocker-cowboy.jpeg', import.meta.url).href} alt={aiProfile.name} />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
          )}
          
          {message.role === 'system' ? (
            <div className="max-w-[60%] rounded-full px-4 py-1 bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                {message.content}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.metadata?.url && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => window.location.href = message.metadata!.url!}
                  >
                    View →
                  </Button>
                )}
                
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              {message.role === 'assistant' && (
                <RockerMessageActions 
                  messageIndex={index}
                  messageContent={message.content}
                />
              )}
            </div>
          )}
          
          {message.role === 'user' && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg px-4 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}

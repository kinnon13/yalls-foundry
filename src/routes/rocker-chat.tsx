/**
 * Rocker Chat Interface
 * Full conversational AI with voice + text
 */

import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/lib/auth/context';
import { useRockerChat } from '@/hooks/useRockerChat';
import { useRockerVoice } from '@/lib/ai/rocker/voice/useRockerVoice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Mic, 
  MicOff, 
  Brain, 
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PhoneSetup } from '@/components/rocker/PhoneSetup';

export default function RockerChat() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage } = useRockerChat(sessionId);
  const {
    isVoiceMode,
    voiceStatus,
    voiceTranscript,
    toggleVoiceMode,
  } = useRockerVoice();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send voice transcript when it's ready
  useEffect(() => {
    if (voiceTranscript && isVoiceMode) {
      setInput(voiceTranscript);
    }
  }, [voiceTranscript, isVoiceMode]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input.trim());
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = async () => {
    try {
      await toggleVoiceMode();
      if (!isVoiceMode) {
        toast.success('Voice mode activated');
      } else {
        toast.info('Voice mode deactivated');
      }
    } catch (error) {
      toast.error('Failed to toggle voice mode');
    }
  };

  if (!session?.userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to sign in to chat with Rocker.
          </p>
          <Button onClick={() => navigate('/auth')} className="w-full">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Phone Setup Banner */}
        <PhoneSetup />

        {/* Chat Interface */}
        <div className="h-[calc(100vh-12rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 bg-card p-4 rounded-lg shadow-lg border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/rocker')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold">Rocker</h1>
              <p className="text-xs text-muted-foreground">
                Your AI Chief of Staff
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVoiceMode && (
              <Badge variant="secondary" className="gap-1">
                {voiceStatus === 'connected' ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    Listening
                  </>
                ) : voiceStatus === 'connecting' ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Connecting
                  </>
                ) : (
                  'Voice Ready'
                )}
              </Badge>
            )}
            
            <Button
              variant={isVoiceMode ? "default" : "outline"}
              size="icon"
              onClick={handleVoiceToggle}
              className="relative"
            >
              {isVoiceMode ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden shadow-lg">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Start a conversation with Rocker</p>
                  <p className="text-sm">Ask me anything or use voice mode</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        <p className="text-xs opacity-70 mb-1">Suggested actions:</p>
                        <div className="space-y-1">
                          {msg.actions.map((action: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {action.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Rocker is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isVoiceMode ? "Speak or type your message..." : "Type your message..."}
                className="min-h-[60px] max-h-[200px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px] flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            
            {isVoiceMode && voiceTranscript && (
              <p className="text-xs text-muted-foreground mt-2">
                Voice: "{voiceTranscript}"
              </p>
            )}
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Business Chat Onboarding
 * Pure conversational flow for business setup via Rocker
 */

import { useState, useRef, useEffect } from 'react';
import { useBusinessChatFlowVoice } from '@/hooks/useBusinessChatFlowVoice';
import { useVoice } from '@/hooks/useVoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, Send, Building2, User, ArrowLeft } from 'lucide-react';
import { ReviewModal } from './ReviewModal';

interface BusinessChatOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function BusinessChatOnboarding({ onComplete, onSkip, onBack }: BusinessChatOnboardingProps) {
  const [showChoice, setShowChoice] = useState(true); // Start with choice screen
  
  const {
    step,
    messages,
    collected,
    isProcessing,
    handleUserMessage,
    handleAction,
    confirmSetup,
    setStep
  } = useBusinessChatFlowVoice();

  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Don't start chat until user chooses "I run a business"
  const [chatStarted, setChatStarted] = useState(false);

  // Voice (TTS + STT)
  const { speak, stopSpeaking, listen, isSupported } = useVoice({
    enabled: voiceEnabled,
    onTranscript: (text, isFinal) => {
      setInput(text);
      if (isFinal) {
        setIsListening(false);
        handleSend();
      }
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-speak bot messages when voice is enabled
  useEffect(() => {
    if (voiceEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        speak(lastMessage.content);
      }
    }
  }, [messages, voiceEnabled]);

  // Handle completion
  useEffect(() => {
    if (step === 'done') {
      setTimeout(onComplete, 2000);
    }
  }, [step, onComplete]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const text = input.trim();
    setInput('');
    await handleUserMessage(text);
    
    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      listen();
      setIsListening(true);
    }
  };

  const handleSkip = () => {
    stopSpeaking();
    onSkip();
  };
  
  const handleChooseBusiness = () => {
    setShowChoice(false);
    setChatStarted(true);
  };
  
  const handleChooseUser = () => {
    onSkip(); // Skip business setup entirely
  };
  
  // Show choice screen first - matches other onboarding steps aesthetic
  if (showChoice) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 bg-background/80 backdrop-blur-xl border-border/50">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Choose Your Path
              </h2>
              <p className="text-muted-foreground text-lg">
                Are you here as a user or do you run a business?
              </p>
            </div>
            
            <div className="grid gap-4">
              <button
                onClick={handleChooseUser}
                className="group relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all p-8 text-left bg-muted/30 hover:bg-muted/50 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center flex-shrink-0 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                    <User className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold">I'm just a user</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Skip the business setup and go straight to exploring
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleChooseBusiness}
                className="group relative overflow-hidden rounded-xl border-2 border-primary/50 hover:border-primary bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 hover:from-primary/10 hover:via-primary/15 hover:to-primary/10 transition-all p-8 text-left hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center flex-shrink-0 group-hover:from-primary/40 group-hover:to-primary/30 transition-all shadow-lg">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold">I run a business</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Let Rocker help you set up your business profile in under a minute
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border/50">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to previous step
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 bg-background/80 backdrop-blur-xl border-border/50">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Business Profile Setup</h2>
              <p className="text-muted-foreground">
                I'll handle it in chat. You can review everything before saving.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChoice(true)}
              >
                Start over
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Voice controls */}
          <div className="flex gap-2 pb-4 border-b border-border/50">
            <Button
              variant={voiceEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleVoice}
              className="gap-2"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Voice {voiceEnabled ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Messages */}
          <div className="min-h-[400px] max-h-[500px] overflow-y-auto space-y-3 pr-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-2xl px-5 py-3 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                        : 'bg-muted/80 text-foreground border border-border/30'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  {/* Action chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.actions.map((action, actionIdx) => (
                        <Button
                          key={actionIdx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(action)}
                          disabled={isProcessing}
                          className="rounded-full"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-muted/80 border border-border/30 rounded-2xl px-5 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {step !== 'done' && step !== 'saving' && (
            <div className="flex gap-2 items-end pt-4 border-t border-border/50">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                disabled={isProcessing || isListening}
                className="flex-1"
              />
              
              {isSupported && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleMic}
                  disabled={isProcessing}
                  className={isListening ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Skip link */}
          {step !== 'done' && step !== 'saving' && (
            <div className="flex items-center justify-center pt-2">
              <button
                className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
                onClick={handleSkip}
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <ReviewModal
        open={step === 'review'}
        data={collected as any}
        onEdit={(field) => {
          // Map field back to appropriate step
          const stepMap: Record<string, typeof step> = {
            name: 'ask_name',
            categories: 'ask_categories',
            website: 'ask_website',
            phone: 'ask_phone',
            bio: 'ask_bio'
          };
          setStep(stepMap[field] || 'ask_name');
        }}
        onConfirm={confirmSetup}
        onClose={() => setStep('ask_categories')}
      />
    </div>
  );
}

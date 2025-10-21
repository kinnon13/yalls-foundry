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
import { Mic, MicOff, Volume2, VolumeX, Send, Building2, User } from 'lucide-react';
import { ReviewModal } from './ReviewModal';

interface BusinessChatOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function BusinessChatOnboarding({ onComplete, onSkip }: BusinessChatOnboardingProps) {
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
  
  // Show choice screen first
  if (showChoice) {
    return (
      <div className="mx-auto w-full max-w-[600px] px-4 md:px-6 py-6">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Business Setup</h1>
          <p className="text-muted-foreground">
            Do you want to set up a business profile?
          </p>
        </header>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleChooseUser}
              className="p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <User className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <div className="font-semibold text-base mb-1">I'm just a user</div>
                  <div className="text-sm text-muted-foreground">
                    Skip this step and continue
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={handleChooseBusiness}
              className="p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <Building2 className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <div className="font-semibold text-base mb-1">I run a business</div>
                  <div className="text-sm text-muted-foreground">
                    Quick setup with AI in under a minute
                  </div>
                </div>
              </div>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 md:px-6 py-6">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Business Quick Setup</h1>
          <p className="text-sm text-muted-foreground">
            I'll handle it in chat. You can review everything before saving.
          </p>
        </div>
        {chatStarted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChoice(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to choices
          </Button>
        )}
      </header>

      <Card className="p-4 md:p-6 bg-card">
        {/* Voice controls */}
        <div className="flex gap-2 mb-4 pb-4 border-b">
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
        <div className="h-[400px] md:h-[500px] overflow-auto mb-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {step !== 'done' && step !== 'saving' && (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Type your message..."}
              disabled={isProcessing || isListening}
              className="flex-1"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMic}
              disabled={isProcessing}
              className={isListening ? 'bg-red-500 text-white hover:bg-red-600' : ''}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Skip link */}
      {step !== 'done' && step !== 'saving' && (
        <div className="mt-3 flex items-center justify-center">
          <button
            className="text-sm text-muted-foreground underline hover:text-foreground"
            onClick={handleSkip}
          >
            Skip for now
          </button>
        </div>
      )}

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

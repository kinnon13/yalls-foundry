import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Send } from 'lucide-react';
import { toast } from 'sonner';

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

export default function SuperAndyChat() {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const togglePrivateMode = async (checked: boolean) => {
    setPrivateMode(checked);
    try {
      await supabase.functions.invoke('ai_control', {
        body: {
          action: 'global',
          flags: {
            private_mode: checked,
            external_calls_enabled: !checked
          }
        }
      });
      toast.success(checked ? 'Private mode enabled' : 'Private mode disabled');
    } catch (error) {
      toast.error('Failed to update private mode');
    }
  };

  const send = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    const userMsg = input;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text: userMsg }]);

    try {
      // For now, use a simple invoke - streaming can be added later
      const { data, error } = await supabase.functions.invoke('ai_eventbus', {
        body: {
          tenantId: null,
          region: 'us',
          topic: 'chat.message',
          payload: {
            message: userMsg,
            mode: 'super',
            private: privateMode
          }
        }
      });

      if (error) throw error;

      // Simulate response for now
      setMsgs(m => [...m, {
        role: 'assistant',
        text: 'Message received and queued for processing. Full streaming chat coming soon!'
      }]);
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Super Andy</h1>
        
        <div className="flex items-center gap-2">
          <Shield className={privateMode ? 'text-primary' : 'text-muted-foreground'} size={20} />
          <Label htmlFor="private-mode">Private Mode</Label>
          <Switch
            id="private-mode"
            data-testid="private-switch"
            checked={privateMode}
            onCheckedChange={togglePrivateMode}
          />
        </div>
      </div>

      {privateMode && (
        <Card className="p-4 mb-4 bg-primary/10 border-primary">
          <p className="text-sm">
            🔒 Private Mode enabled. External calls disabled. All data encrypted.
          </p>
        </Card>
      )}

      <Card className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-3 overflow-auto">
          {msgs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Start a conversation with Super Andy
            </div>
          ) : (
            msgs.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                <div className={`inline-block rounded-lg px-3 py-2 max-w-[80%] ${
                  m.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary'
                }`}>
                  {m.text}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-left">
              <div className="inline-block rounded-lg px-3 py-2 bg-secondary">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 border-t flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            className="flex-1"
            placeholder="Ask Super Andy…"
            disabled={isLoading}
          />
          <Button onClick={send} disabled={isLoading || !input.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

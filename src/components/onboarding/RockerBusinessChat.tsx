import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface CategorySuggestion {
  label: string;
  parent_key: string | null;
  synonyms: string[];
}

interface RockerBusinessChatProps {
  businessName: string;
  website: string;
  onSuggestCategories: (categories: CategorySuggestion[]) => void;
}

export function RockerBusinessChat({ businessName, website, onSuggestCategories }: RockerBusinessChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: businessName 
        ? `Great! Tell me about ${businessName}. What do you sell most? Drop 2-3 examples.`
        : "👋 Hi! I'll help set up your business. First, what do you sell or offer?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Trigger AI classification when business name changes
  useEffect(() => {
    if (businessName && website && messages.length === 1) {
      classifyBusiness(businessName, website, []);
    }
  }, [businessName, website]);

  const classifyBusiness = async (name: string, site: string, examples: string[]) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-classify-business`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, website: site, examples })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.categories && data.categories.length > 0) {
          onSuggestCategories(data.categories);
        }
      }
    } catch (err) {
      console.error('Classification error:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setLoading(true);

    try {
      // Extract examples from user input
      const examples = input.split(',').map(s => s.trim()).filter(Boolean);
      
      // Classify based on examples
      await classifyBusiness(businessName, website, examples);

      // Simulate AI response
      setTimeout(() => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: "Perfect! I've suggested some categories based on what you told me. Feel free to add or remove any. Ready when you are!",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
        setLoading(false);
      }, 1500);

    } catch (err) {
      console.error('Send error:', err);
      setIsTyping(false);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="sticky top-0 p-3 border-b bg-background z-10">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Rocker</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-1 items-center px-4 py-2 rounded-2xl bg-muted">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:120ms]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:240ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

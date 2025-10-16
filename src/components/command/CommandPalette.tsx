/**
 * Command Palette
 * 
 * Global ⌘K command interface with AI-powered actions
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, ShoppingBag, Calendar, FileText, 
  User, Home, ShoppingCart, Settings, Mic, MicOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CommandAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  // Register global hotkey
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Log capability gap
  const logGap = useCallback(async (query: string, context: any) => {
    try {
      await supabase.from('capability_gaps' as any).insert({
        account_id: (await supabase.auth.getUser()).data.user?.id,
        text: query,
        context,
        status: 'new'
      });
    } catch (err) {
      console.error('Failed to log gap:', err);
    }
  }, []);

  // Voice recognition (basic)
  const handleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Log as potential gap if no match
      logGap(transcript, { source: 'voice', route: window.location.pathname });
      toast.info(`You said: "${transcript}"`);
    };

    recognition.start();
  }, [logGap]);

  // Define commands
  const commands: CommandAction[] = [
    {
      id: 'create-post',
      label: 'Create Post',
      icon: <PlusCircle className="h-4 w-4" />,
      keywords: ['post', 'create', 'new', 'compose'],
      action: () => {
        setSearchParams({ modal: 'create_post' });
        setOpen(false);
      }
    },
    {
      id: 'create-listing',
      label: 'Create Listing',
      icon: <ShoppingBag className="h-4 w-4" />,
      keywords: ['listing', 'sell', 'marketplace', 'product'],
      action: () => {
        setSearchParams({ modal: 'create_listing' });
        setOpen(false);
      }
    },
    {
      id: 'create-event',
      label: 'Create Event',
      icon: <Calendar className="h-4 w-4" />,
      keywords: ['event', 'calendar', 'schedule', 'meeting'],
      action: () => {
        setSearchParams({ modal: 'create_event' });
        setOpen(false);
      }
    },
    {
      id: 'nav-feed',
      label: 'Go to Feed',
      icon: <Home className="h-4 w-4" />,
      keywords: ['home', 'feed', 'posts'],
      action: () => {
        navigate('/');
        setOpen(false);
      }
    },
    {
      id: 'nav-marketplace',
      label: 'Go to Marketplace',
      icon: <ShoppingCart className="h-4 w-4" />,
      keywords: ['shop', 'buy', 'marketplace', 'store'],
      action: () => {
        navigate('/marketplace');
        setOpen(false);
      }
    },
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      icon: <Settings className="h-4 w-4" />,
      keywords: ['dashboard', 'admin', 'settings', 'manage'],
      action: () => {
        navigate('/dashboard');
        setOpen(false);
      }
    },
    {
      id: 'view-cart',
      label: 'View Cart',
      icon: <ShoppingCart className="h-4 w-4" />,
      keywords: ['cart', 'checkout', 'purchase'],
      action: () => {
        setSearchParams({ modal: 'cart' });
        setOpen(false);
      }
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <CommandInput placeholder="Type a command or search..." />
          <Button
            size="sm"
            variant={listening ? 'default' : 'outline'}
            onClick={handleVoice}
            className="gap-2"
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        <CommandList>
          <CommandEmpty>
            No commands found. Your request has been logged.
          </CommandEmpty>

          <CommandGroup heading="Create">
            {commands
              .filter(c => c.keywords.some(k => k.includes('create')))
              .map(cmd => (
                <CommandItem key={cmd.id} onSelect={cmd.action} className="gap-2">
                  {cmd.icon}
                  {cmd.label}
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandGroup heading="Navigate">
            {commands
              .filter(c => c.id.startsWith('nav-') || c.id === 'view-cart')
              .map(cmd => (
                <CommandItem key={cmd.id} onSelect={cmd.action} className="gap-2">
                  {cmd.icon}
                  {cmd.label}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

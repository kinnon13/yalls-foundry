import { useEffect, useRef, useState } from 'react';
import { useRockerGlobal } from '@/lib/ai/rocker/context';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

// Proactive nudge: shows a toast after inactivity to offer help
// Minimal, non-intrusive: triggers once per session unless user interacts again
export default function InactivityNudge() {
  const { isOpen, setIsOpen, isVoiceMode, isAlwaysListening } = useRockerGlobal();
  const { toast } = useToast();
  const lastActivity = useRef<number>(Date.now());
  const [nudged, setNudged] = useState(false);

  useEffect(() => {
    const mark = () => {
      lastActivity.current = Date.now();
      setNudged(false);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, mark, { passive: true } as any));
    return () => events.forEach((ev) => window.removeEventListener(ev, mark as any));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const idleMs = Date.now() - lastActivity.current;
      const shouldNudge = idleMs > 45_000 && !nudged && !isOpen && !isVoiceMode && !isAlwaysListening;
      if (shouldNudge) {
        setNudged(true);
        toast({
          title: 'Need a hand?',
          description: "I'm here if you need help with anything.",
          action: (
            <ToastAction altText="Open Chat" onClick={() => setIsOpen(true)}>
              Open Chat
            </ToastAction>
          ),
        });
      }
    }, 5_000);
    return () => clearInterval(interval);
  }, [nudged, isOpen, isVoiceMode, isAlwaysListening, setIsOpen, toast]);

  return null;
}

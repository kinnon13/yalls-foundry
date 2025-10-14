/**
 * Feedback Widget
 * 
 * Floating feedback button with pop-up form.
 * Keyboard shortcut: Alt+F
 */

import { useEffect, useState } from 'react';
import { addFeedback } from '@/lib/feedback/store';
import type { FeedbackSeverity } from '@/lib/feedback/types';
import { useSession } from '@/lib/auth/context';

export default function FeedbackWidget() {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [severity, setSeverity] = useState<FeedbackSeverity>('bug');
  const [ok, setOk] = useState<string | null>(null);

  // Alt+F to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'f') {
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = () => {
    const msg = message.trim();
    if (!msg) return;
    
    addFeedback({
      path: window.location.pathname,
      message: msg.slice(0, 1000),
      email: email.trim() || undefined,
      role: session?.role,
      userAgent: navigator.userAgent,
      severity,
    });
    
    setMessage('');
    setEmail('');
    setSeverity('bug');
    setOk('Thanks! Sent.');
    setTimeout(() => {
      setOk(null);
      setOpen(false);
    }, 800);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full border bg-background px-4 py-2 text-sm shadow-lg hover:bg-accent transition-colors"
        aria-label="Open feedback"
      >
        💬 Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20">
          <div className="w-full sm:max-w-md m-3 rounded-xl bg-background p-4 shadow-lg border">
            <div className="mb-3 text-sm font-medium">Tell us what's broken or confusing</div>

            <label className="block mb-2">
              <span className="block text-xs text-muted-foreground mb-1">Severity</span>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as FeedbackSeverity)}
                className="w-full rounded border border-input bg-background p-2 text-sm"
              >
                <option value="bug">🐛 Bug</option>
                <option value="confusing">❓ Confusing</option>
                <option value="idea">💡 Idea</option>
                <option value="other">📝 Other</option>
              </select>
            </label>

            <label className="block mb-2">
              <span className="block text-xs text-muted-foreground mb-1">Message</span>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="What happened? What did you expect?"
                className="w-full rounded border border-input bg-background p-2 text-sm"
              />
            </label>

            <label className="block mb-3">
              <span className="block text-xs text-muted-foreground mb-1">Email (optional)</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded border border-input bg-background p-2 text-sm"
              />
            </label>

            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-green-600 font-medium">{ok}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded border border-input px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-muted-foreground">
              Tip: Press <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Alt</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">F</kbd> to open from anywhere
            </div>
          </div>
        </div>
      )}
    </>
  );
}

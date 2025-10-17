import { useState } from 'react';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';

export function RockerDock() {
  const [open, setOpen] = useState(false);
  const { session } = useSession();

  const logExample = async () => {
    if (!session?.userId) return;
    await supabase.rpc('rocker_log_action', {
      p_user_id: session.userId,
      p_agent: 'rocker',
      p_action: 'hello_world',
      p_input: { where: 'dock' },
      p_output: { ok: true },
      p_result: 'success'
    });
  };

  return (
    <>
      <button
        className="fixed bottom-4 right-4 rounded-full shadow-lg px-4 py-3 bg-black text-white"
        onClick={() => { setOpen(!open); }}
        aria-label="Open Rocker"
      >
        🤖 Rocker
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 w-96 max-w-[92vw] bg-white shadow-xl rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Rocker</h3>
            <button onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">I can draft actions for you and keep an audit trail.</p>
            <button className="border px-3 py-2 rounded" onClick={logExample}>
              Log a test action
            </button>
            <a className="text-sm underline" href="/settings/ai">AI Settings</a>
          </div>
        </div>
      )}
    </>
  );
}

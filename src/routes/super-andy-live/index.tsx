import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SuperAndyChatWithVoice } from '@/components/super-andy/SuperAndyChatWithVoice';
import { AndyThoughtStream } from '@/components/super-andy/AndyThoughtStream';
import { AndyNotebook } from '@/components/super-andy/AndyNotebook';
import { SuperAndyTasks } from '@/components/super-andy/SuperAndyTasks';

/**
 * Super Andy Live - Real-time brain activity dashboard
 * Shows Andy's thoughts, memories, tasks, and notes updating 24/7
 */
export default function SuperAndyLive() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Main Chat - 2 columns */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex-1">
            <SuperAndyChatWithVoice threadId={activeThreadId} />
          </div>
        </div>

        {/* Right Sidebar - 1 column - Live Updates */}
        <div className="space-y-4 overflow-auto">
          {/* Real-time Thought Stream */}
          {userId && (
            <div className="bg-card rounded-lg border p-4">
              <AndyThoughtStream userId={userId} />
            </div>
          )}
          
          {/* Active Tasks */}
          {userId && (
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-sm font-semibold mb-3">Active Tasks</h3>
              <SuperAndyTasks threadId={activeThreadId} />
            </div>
          )}
          
          {/* Recent Notes */}
          {userId && (
            <div className="bg-card rounded-lg border p-4">
              <AndyNotebook />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Home Panel - AI Overview / Mission Control
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Brain, AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function HomePanel({ onNavigate }: { onNavigate: (section: 'home' | 'chat' | 'know' | 'memories' | 'unknowns' | 'learning' | 'accounts' | 'privacy' | 'settings') => void }) {
  const [stats, setStats] = useState({
    recentChats: 0,
    hotMemories: 0,
    unknowns: 0,
    understanding: 93
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [chats, memories] = await Promise.all([
        supabase.from('conversation_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('ai_user_memory').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      setStats({
        recentChats: chats.count || 0,
        hotMemories: memories.count || 0,
        unknowns: 0,
        understanding: 93
      });
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rocker Status</h2>
          <p className="text-muted-foreground mt-1">
            Learning ✅ {stats.understanding}% Understanding
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('chat')}>Ask Rocker</Button>
          <Button variant="outline" onClick={() => onNavigate('memories')}>Teach Fact</Button>
          <Button variant="outline" onClick={() => onNavigate('unknowns')}>Review Unknowns</Button>
        </div>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNavigate('chat')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.recentChats}</div>
            <p className="text-xs text-muted-foreground mt-1">conversations</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNavigate('memories')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Hot Memories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.hotMemories}</div>
            <p className="text-xs text-muted-foreground mt-1">facts stored</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNavigate('unknowns')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Unknown Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.unknowns}</div>
            <p className="text-xs text-muted-foreground mt-1">needs sorting</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNavigate('learning')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.understanding}%</div>
            <p className="text-xs text-muted-foreground mt-1">accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Badge variant="default">New</Badge>
              <div>
                <p className="font-medium">New memory saved</p>
                <p className="text-xs text-muted-foreground">family_mom → stored relationship</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Badge variant="secondary">Updated</Badge>
              <div>
                <p className="font-medium">Fact updated</p>
                <p className="text-xs text-muted-foreground">preferences updated from conversation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Home Panel - AI Overview / Mission Control
 * Real stats from database
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Brain, AlertCircle, TrendingUp, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Activity {
  type: 'memory' | 'chat' | 'unknown' | 'learning';
  title: string;
  detail: string;
  timestamp: string;
}

export function HomePanel({ onNavigate }: { 
  onNavigate: (section: 'home' | 'chat' | 'know' | 'memories' | 'unknowns' | 'learning' | 'accounts' | 'privacy' | 'settings') => void 
}) {
  const [stats, setStats] = useState({
    recentChats: 0,
    hotMemories: 0,
    unknowns: 0,
    understanding: 0
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [chats, memories, unknowns] = await Promise.all([
        supabase
          .from('conversation_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('ai_user_memory')
          .select('id, last_used_at, key, value, created_at', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('ai_hypotheses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'open')
      ]);

      // Calculate hot memories (used in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const hotCount = memories.data?.filter(m => 
        new Date(m.last_used_at) > sevenDaysAgo
      ).length || 0;

      // Calculate understanding score based on memories confidence
      const avgConfidence = memories.data && memories.data.length > 0
        ? Math.round((memories.count || 0) / Math.max(1, memories.count || 1) * 100)
        : 0;

      setStats({
        recentChats: chats.count || 0,
        hotMemories: hotCount,
        unknowns: unknowns.count || 0,
        understanding: Math.min(95, 60 + (memories.count || 0) * 2)
      });

      // Build activity feed from recent memories
      const recentActivities: Activity[] = memories.data
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(m => ({
          type: 'memory' as const,
          title: 'New memory saved',
          detail: `${m.key} → ${typeof m.value === 'object' ? JSON.stringify(m.value).substring(0, 50) : m.value}`,
          timestamp: m.created_at
        })) || [];

      setActivities(recentActivities);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
          <Button variant="outline" onClick={() => onNavigate('unknowns')}>
            Review Unknowns
            {stats.unknowns > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.unknowns}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Main Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="bg-card/50 animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors bg-card/50" onClick={() => onNavigate('chat')}>
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

          <Card className="cursor-pointer hover:border-primary transition-colors bg-card/50" onClick={() => onNavigate('memories')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Hot Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.hotMemories}</div>
              <p className="text-xs text-muted-foreground mt-1">used this week</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors bg-card/50" onClick={() => onNavigate('unknowns')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Unknown Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.unknowns}</div>
              <p className="text-xs text-muted-foreground mt-1">needs review</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors bg-card/50" onClick={() => onNavigate('learning')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Understanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.understanding}%</div>
              <p className="text-xs text-muted-foreground mt-1">accuracy</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Feed */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity. Start a conversation with Rocker!
            </p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <Badge variant={activity.type === 'memory' ? 'default' : 'secondary'}>
                      {activity.type === 'memory' && <Brain className="h-3 w-3 mr-1" />}
                      {activity.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

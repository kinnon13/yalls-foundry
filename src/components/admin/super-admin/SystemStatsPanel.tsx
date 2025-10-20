/**
 * System Stats Dashboard - Super Admin Only
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Database, MessageSquare, Clock, Zap } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalMessages: number;
  totalMemories: number;
  totalTasks: number;
  activeThreads: number;
  todayActivity: number;
}

export function SystemStatsPanel() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalMessages: 0,
    totalMemories: 0,
    totalTasks: 0,
    activeThreads: 0,
    todayActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: messagesCount },
        { count: memoriesCount },
        { count: tasksCount },
        { count: threadsCount },
        { count: todayCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('rocker_messages').select('*', { count: 'exact', head: true }),
        supabase.from('ai_user_memory').select('*', { count: 'exact', head: true }),
        supabase.from('rocker_tasks').select('*', { count: 'exact', head: true }),
        supabase.from('rocker_threads').select('*', { count: 'exact', head: true }),
        supabase.from('usage_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalMessages: messagesCount || 0,
        totalMemories: memoriesCount || 0,
        totalTasks: tasksCount || 0,
        activeThreads: threadsCount || 0,
        todayActivity: todayCount || 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Messages', value: stats.totalMessages, icon: MessageSquare, color: 'text-green-500' },
    { label: 'Memories', value: stats.totalMemories, icon: Database, color: 'text-purple-500' },
    { label: 'Tasks', value: stats.totalTasks, icon: Clock, color: 'text-orange-500' },
    { label: 'Active Threads', value: stats.activeThreads, icon: Activity, color: 'text-pink-500' },
    { label: 'Today Activity', value: stats.todayActivity, icon: Zap, color: 'text-yellow-500' }
  ];

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading stats...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

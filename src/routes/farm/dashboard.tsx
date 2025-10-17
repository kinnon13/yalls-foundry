/**
 * Barn Dashboard - Capacity + Care Due
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Waves, Users, Calendar, FileText, AlertTriangle } from 'lucide-react';

export default function FarmDashboard() {
  const { data: horses = [] } = useQuery({
    queryKey: ['farm-horses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('horses' as any)
        .select('*')
        .limit(10);
      return data || [];
    },
  });

  const { data: boarders = [] } = useQuery({
    queryKey: ['farm-boarders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('boarders' as any)
        .select('*')
        .eq('status', 'active')
        .limit(10);
      return data || [];
    },
  });

  const { data: overdueTasks = [] } = useQuery({
    queryKey: ['farm-tasks-overdue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks' as any)
        .select('*')
        .eq('status', 'open' as any)
        .lt('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Barn Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Waves className="h-4 w-4 text-blue-500" />
              <div className="text-sm text-muted-foreground">Horses</div>
            </div>
            <div className="text-2xl font-bold">{horses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-500" />
              <div className="text-sm text-muted-foreground">Boarders</div>
            </div>
            <div className="text-2xl font-bold">{boarders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div className="text-sm text-muted-foreground">Overdue Tasks</div>
            </div>
            <div className="text-2xl font-bold">{overdueTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Link to="/farm/calendar">
              <Button className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(task.due_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Horses */}
      <Card>
        <CardHeader>
          <CardTitle>Horses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {horses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No horses yet
              </div>
            ) : (
              horses.map((horse: any) => (
                <div key={horse.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{horse.name}</div>
                    {horse.barn_name && (
                      <div className="text-sm text-muted-foreground">
                        Barn: {horse.barn_name}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">{horse.sex || 'Unknown'}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

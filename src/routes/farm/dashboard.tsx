/**
 * Farm Dashboard - Complete with Calendar, Tasks, Care Plans, Appointments
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Waves, Users, Calendar, AlertTriangle, ClipboardList, Stethoscope } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState } from 'react';
import { toast } from 'sonner';
import { applyCarePlan, generateInvoice } from '@/lib/farm/service';

export default function FarmDashboard() {
  const [selectedHorse, setSelectedHorse] = useState<string | null>(null);

  const { data: horses = [], refetch: refetchHorses } = useQuery({
    queryKey: ['farm-horses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('horses' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
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
        .limit(20);
      return data || [];
    },
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['farm-tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks' as any)
        .select('*')
        .order('due_at', { ascending: true })
        .limit(20);
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['farm-appointments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments' as any)
        .select('*')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10);
      return data || [];
    },
  });

  const { data: carePlans = [] } = useQuery({
    queryKey: ['care-plans'],
    queryFn: async () => {
      const { data } = await supabase
        .from('care_plans' as any)
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const overdueTasks = tasks.filter((t: any) => 
    t.status === 'open' && new Date(t.due_at) < new Date()
  );

  const handleApplyCarePlan = async (horseId: string, templateName: string) => {
    try {
      await applyCarePlan(horseId, templateName);
      toast.success('Care plan applied');
      refetchTasks();
    } catch (error) {
      toast.error('Failed to apply care plan');
    }
  };

  const handleGenerateInvoice = async (boarderId: string) => {
    try {
      const periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - 1);
      await generateInvoice(boarderId, periodStart.toISOString());
      toast.success('Invoice generated');
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await supabase
        .from('tasks' as any)
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      toast.success('Task completed');
      refetchTasks();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Barn Operations</h1>
        <Link to="/farm/calendar">
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Full Calendar
          </Button>
        </Link>
      </div>

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
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
            <div className="text-2xl font-bold">{overdueTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
            <div className="text-2xl font-bold">
              {appointments.filter((a: any) => 
                new Date(a.scheduled_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList className="mb-6">
          <TabsTrigger value="tasks">
            <ClipboardList className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="care">
            <Stethoscope className="h-4 w-4 mr-2" />
            Care Plans
          </TabsTrigger>
          <TabsTrigger value="horses">
            <Waves className="h-4 w-4 mr-2" />
            Horses
          </TabsTrigger>
          <TabsTrigger value="boarders">
            <Users className="h-4 w-4 mr-2" />
            Boarders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks scheduled
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => {
                    const isOverdue = new Date(task.due_at) < new Date() && task.status === 'open';
                    return (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{task.title}</div>
                        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                        {task.status === 'done' && <Badge variant="default">Done</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Due: {new Date(task.due_at).toLocaleString()}
                          </div>
                          {task.assigned_to && (
                            <div className="text-sm text-muted-foreground">
                              Assigned to: {task.assigned_to}
                            </div>
                          )}
                        </div>
                        {task.status === 'open' && (
                          <Button size="sm" onClick={() => handleCompleteTask(task.id)}>
                            Complete
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments scheduled
                </div>
              ) : (
                <div className="space-y-2">
                  {appointments.map((apt: any) => (
                    <div key={apt.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{apt.title}</div>
                        <Badge variant={apt.confirmed ? 'default' : 'outline'}>
                          {apt.confirmed ? 'Confirmed' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(apt.scheduled_at).toLocaleString()}
                      </div>
                      {apt.provider_name && (
                        <div className="text-sm text-muted-foreground">
                          Provider: {apt.provider_name}
                        </div>
                      )}
                      {apt.notes && (
                        <div className="text-sm mt-2">{apt.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="care">
          <Card>
            <CardHeader>
              <CardTitle>Active Care Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {carePlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active care plans
                </div>
              ) : (
                <div className="space-y-3">
                  {carePlans.map((plan: any) => (
                    <div key={plan.id} className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold">{plan.template_name}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => selectedHorse && handleApplyCarePlan(selectedHorse, plan.template_name)}
                          disabled={!selectedHorse}
                        >
                          Apply to Horse
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Frequency: {plan.schedule?.frequency || 'Custom'}
                      </div>
                      {plan.tasks && (
                        <div className="text-sm">
                          <div className="font-medium mb-1">Tasks:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {Object.entries(plan.tasks).map(([key, val]: [string, any]) => (
                              <li key={key}>{val.title || key}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horses">
          <Card>
            <CardHeader>
              <CardTitle>Horses in Barn</CardTitle>
            </CardHeader>
            <CardContent>
              {horses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No horses registered
                </div>
              ) : (
                <div className="space-y-2">
                  {horses.map((horse: any) => (
                    <div
                      key={horse.id}
                      className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                        selectedHorse === horse.id ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedHorse(horse.id)}
                    >
                      <div>
                        <div className="font-medium">{horse.name}</div>
                        {horse.barn_name && (
                          <div className="text-sm text-muted-foreground">
                            Stall: {horse.barn_name}
                          </div>
                        )}
                        {horse.breed && (
                          <div className="text-sm text-muted-foreground">
                            Breed: {horse.breed}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{horse.sex || 'Unknown'}</Badge>
                        {horse.age && (
                          <div className="text-xs text-muted-foreground">
                            {horse.age} years
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boarders">
          <Card>
            <CardHeader>
              <CardTitle>Active Boarders</CardTitle>
            </CardHeader>
            <CardContent>
              {boarders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active boarders
                </div>
              ) : (
                <div className="space-y-2">
                  {boarders.map((boarder: any) => (
                    <div key={boarder.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">Boarder #{boarder.id.slice(0, 8)}</div>
                        <div className="text-sm text-muted-foreground">
                          ${(boarder.monthly_rate_cents / 100).toFixed(2)}/month
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Since: {new Date(boarder.start_date).toLocaleDateString()}
                        </div>
                        {boarder.board_type && (
                          <div className="text-sm">
                            <Badge variant="outline">{boarder.board_type}</Badge>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateInvoice(boarder.id)}
                      >
                        Generate Invoice
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

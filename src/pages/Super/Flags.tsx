import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ControlFlags = {
  global_pause: boolean | null;
  write_freeze: boolean | null;
  external_calls_enabled: boolean | null;
  burst_override: boolean | null;
};

export default function FlagsPage() {
  const queryClient = useQueryClient();

  const { data: flags } = useQuery({
    queryKey: ['flags'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_control_flags')
        .select('*')
        .single();
      return data as ControlFlags;
    },
  });

  const updateFlags = useMutation({
    mutationFn: async (newFlags: Partial<ControlFlags>) => {
      const { data } = await supabase.functions.invoke('ai_control', {
        body: {
          action: 'global',
          flags: newFlags
        }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      toast.success('Flags updated');
    },
  });

  if (!flags) return <div>Loading...</div>;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Control Flags</h1>
      
      <div className="grid gap-6 max-w-2xl">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pause-all">Pause All</Label>
              <p className="text-sm text-muted-foreground">
                Stop all job picking immediately
              </p>
            </div>
            <Switch
              id="pause-all"
              data-testid="toggle-pause"
              checked={flags.global_pause ?? false}
              onCheckedChange={(checked) => updateFlags.mutate({ global_pause: checked })}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="write-freeze">Write Freeze</Label>
              <p className="text-sm text-muted-foreground">
                Block all mutating operations
              </p>
            </div>
            <Switch
              id="write-freeze"
              data-testid="toggle-freeze"
              checked={flags.write_freeze ?? false}
              onCheckedChange={(checked) => updateFlags.mutate({ write_freeze: checked })}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="external-calls">External Calls Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Allow calls to external APIs
              </p>
            </div>
            <Switch
              id="external-calls"
              data-testid="toggle-external"
              checked={flags.external_calls_enabled ?? false}
              onCheckedChange={(checked) => updateFlags.mutate({ external_calls_enabled: checked })}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="burst-override">Burst Override</Label>
              <p className="text-sm text-muted-foreground">
                Allow pools to exceed max concurrency
              </p>
            </div>
            <Switch
              id="burst-override"
              data-testid="toggle-burst"
              checked={flags.burst_override ?? false}
              onCheckedChange={(checked) => updateFlags.mutate({ burst_override: checked })}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

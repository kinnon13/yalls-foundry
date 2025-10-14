/**
 * Business Settings - Profile
 * 
 * Update business name, description, capabilities (Zod validated)
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessService } from '@/lib/business/service.supabase';
import { CreateBusinessInput, BusinessCapabilitySchema } from '@/entities/business';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import type { BusinessCapability } from '@/entities/business';

export default function BusinessProfileSettings() {
  const { bizId } = useParams<{ bizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCapabilities, setSelectedCapabilities] = useState<BusinessCapability[]>([]);

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', bizId],
    queryFn: () => businessService.getById(bizId!),
    enabled: !!bizId,
  });

  const form = useForm({
    resolver: zodResolver(CreateBusinessInput.pick({ name: true, description: true })),
    values: {
      name: business?.name || '',
      description: business?.description || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => businessService.update(bizId!, {
      name: data.name,
      description: data.description,
      capabilities: selectedCapabilities.length > 0 ? selectedCapabilities : business?.capabilities,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', bizId] });
      toast({ title: 'Business updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleCapabilityAdd = (capability: string) => {
    if (!selectedCapabilities.includes(capability as BusinessCapability) && selectedCapabilities.length < 10) {
      setSelectedCapabilities([...selectedCapabilities, capability as BusinessCapability]);
    }
  };

  const handleCapabilityRemove = (capability: string) => {
    setSelectedCapabilities(selectedCapabilities.filter(c => c !== capability) as BusinessCapability[]);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const capabilities = BusinessCapabilitySchema.options;
  const currentCapabilities = selectedCapabilities.length > 0 ? selectedCapabilities : (business?.capabilities || []);

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Acme Stables" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe your business..." rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Capabilities (max 10)</FormLabel>
                <Select onValueChange={handleCapabilityAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add capability" />
                  </SelectTrigger>
                  <SelectContent>
                    {capabilities.map((cap) => (
                      <SelectItem key={cap} value={cap}>{cap}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentCapabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">
                      {cap}
                      <button
                        type="button"
                        onClick={() => handleCapabilityRemove(cap)}
                        className="ml-2 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

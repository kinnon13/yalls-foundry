/**
 * Create Horse Page
 * 
 * Form to create new horse profile with Zod validation.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { SEOHelmet } from '@/lib/seo/helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { entityProfileService } from '@/lib/profiles/entity-service';
import { CreateHorseSchema, type CreateHorseInput } from '@/entities/horse';
import { useSession } from '@/lib/auth/context';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Sparkles } from 'lucide-react';

export default function CreateHorse() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateHorseInput>({
    resolver: zodResolver(CreateHorseSchema),
    defaultValues: {
      type: 'horse',
      name: '',
      custom_fields: {
        status: 'active',
      },
      claimed_by: session?.userId,
    },
  });

  const onSubmit = async (values: CreateHorseInput) => {
    if (!session) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'Please log in to create a horse profile',
      });
      return;
    }

    setSubmitting(true);
    try {
      const horse = await entityProfileService.create({
        type: 'horse',
        name: values.name,
        custom_fields: values.custom_fields,
        claimed_by: session.userId,
        tenant_id: values.tenant_id,
      });

      toast({
        title: 'Horse created',
        description: `${horse.name} has been added to the registry`,
      });

      navigate(`/horses/${horse.id}`);
    } catch (error) {
      console.error('Create horse error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create horse',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOHelmet
        title="Create Horse Profile"
        description="Add a new horse to the registry with breed, pedigree, and discipline information"
      />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Create Horse Profile</h1>
              <p className="text-muted-foreground">
                Add a new horse to the registry
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the horse's details. Required fields are marked with *
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Horse name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Breed */}
                  <FormField
                    control={form.control}
                    name="custom_fields.breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Thoroughbred, Quarter Horse" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sex */}
                  <FormField
                    control={form.control}
                    name="custom_fields.sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="M">Stallion</SelectItem>
                            <SelectItem value="F">Mare</SelectItem>
                            <SelectItem value="Gelding">Gelding</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date of Birth */}
                  <FormField
                    control={form.control}
                    name="custom_fields.dob"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                              disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                              }
                              initialFocus
                              className={cn('p-3 pointer-events-auto')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Used to calculate the horse's age
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color */}
                  <FormField
                    control={form.control}
                    name="custom_fields.color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bay, Chestnut, Black" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Height */}
                  <FormField
                    control={form.control}
                    name="custom_fields.height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (hands)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 16.2"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Height measured in hands (1 hand = 4 inches)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? 'Creating...' : 'Create Horse'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/horses')}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

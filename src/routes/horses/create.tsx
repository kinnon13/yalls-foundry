/**
 * Create Horse Page
 * 
 * Form to create a new horse entity profile
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { entityProfileService } from '@/lib/profiles/entity-service';
import { toast } from 'sonner';
import { Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const horseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  color: z.string().optional(),
  sire: z.string().optional(),
  dam: z.string().optional(),
});

type HorseFormData = z.infer<typeof horseSchema>;

export default function CreateHorsePage() {
  const navigate = useNavigate();

  const form = useForm<HorseFormData>({
    resolver: zodResolver(horseSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      breed: '',
      dateOfBirth: '',
      color: '',
      sire: '',
      dam: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: HorseFormData) => {
      const { name, slug, description, breed, dateOfBirth, color, sire, dam } = data;
      
      const customFields: Record<string, any> = {};
      if (breed) customFields.breed = breed;
      if (dateOfBirth) customFields.date_of_birth = dateOfBirth;
      if (color) customFields.color = color;
      if (sire) customFields.sire = sire;
      if (dam) customFields.dam = dam;

      return entityProfileService.create({
        entity_type: 'horse',
        name,
        slug,
        description,
        custom_fields: customFields,
      });
    },
    onSuccess: (horse) => {
      if (horse) {
        toast.success('Horse created successfully');
        navigate(`/horses/${horse.id}`);
      } else {
        toast.error('Failed to create horse');
      }
    },
    onError: (error) => {
      console.error('Create horse error:', error);
      toast.error('Failed to create horse');
    },
  });

  const onSubmit = (data: HorseFormData) => {
    createMutation.mutate(data);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    if (!form.formState.dirtyFields.slug) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      form.setValue('slug', slug);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Link to="/horses">
        <Button variant="ghost" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Horses
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Create Horse Profile
          </CardTitle>
          <CardDescription>
            Add a new horse to the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Thunder Strike" 
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="thunder-strike" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier (auto-generated from name)
                    </FormDescription>
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
                      <Textarea 
                        placeholder="Brief description of the horse..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Thoroughbred" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sire (Father)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lightning Bolt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dam (Mother)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Wind Runner" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Horse'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

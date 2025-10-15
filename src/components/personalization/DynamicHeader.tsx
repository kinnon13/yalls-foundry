/**
 * Dynamic Header Component
 * 
 * AI-generated header that adapts to user interests
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserInterests {
  interests: Record<string, number>;
  top_category?: string;
}

export function DynamicHeader() {
  const [interests, setInterests] = useState<UserInterests | null>(null);
  const [greeting, setGreeting] = useState('Welcome to Yalls.ai');

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('user_interests')
        .select('interests')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return;

      // Find top category
      const interests = data.interests as Record<string, number>;
      const topEntry = Object.entries(interests)
        .sort((a, b) => b[1] - a[1])[0];

      if (topEntry) {
        const [category] = topEntry;
        setInterests({ interests, top_category: category });
        
        // Generate personalized greeting
        const greetings: Record<string, string> = {
          breeding: 'Welcome to Your Breeding Hub',
          events: 'Discover Your Next Event',
          marketplace: 'Find What You Need',
          training: 'Enhance Your Skills',
        };
        
        setGreeting(greetings[category] || 'Welcome Back');
      }
    } catch (error) {
      console.error('Error loading interests:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-2">{greeting}</h1>
        {interests?.top_category && (
          <p className="text-muted-foreground">
            Personalized for your interest in {interests.top_category}
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRockerGreeting = (shouldGreet: boolean) => {
  const hasGreeted = useRef(false);

  useEffect(() => {
    const greet = async () => {
      if (!shouldGreet || hasGreeted.current) return;
      
      // Check if user has already heard the greeting
      const greetingShown = localStorage.getItem('rocker-greeting-shown');
      if (greetingShown === 'true') return;

      hasGreeted.current = true;
      
      try {
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { 
            text: 'Welcome to yalls.ai! Can I help you create an account?',
            voice: 'alloy'
          }
        });

        if (error) throw error;

        if (data?.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
          await audio.play();
          
          // Mark greeting as shown
          localStorage.setItem('rocker-greeting-shown', 'true');
        }
      } catch (error) {
        console.error('Error playing greeting:', error);
      }
    };

    // Small delay to let page load
    const timer = setTimeout(greet, 1000);
    return () => clearTimeout(timer);
  }, [shouldGreet]);
};

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRockerGreeting } from '@/hooks/useRockerGreeting';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setLoading(false);
      
      // Auto-redirect to dashboard if logged in
      if (session) {
        navigate('/dashboard');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Trigger greeting for non-logged-in users
  useRockerGreeting(!isLoggedIn && !loading);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Yalls.ai</h1>
        <p className="text-xl text-muted-foreground">Your AI-powered equestrian community</p>
        
        <div className="flex gap-4 justify-center mt-8">
          {isLoggedIn ? (
            <Button onClick={() => navigate('/dashboard?m=overview')} size="lg">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button onClick={() => navigate('/login')} size="lg">
                Create Account
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" size="lg">
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

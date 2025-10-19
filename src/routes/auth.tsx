/**
 * Unified Auth Page - Single canonical entry point
 * Modes: login | signup | reset
 * Mac-style design with glass morphism
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { useSession } from '@/lib/auth/context';
import { signUpWithPassword, signInWithPassword } from '@/lib/auth/adapters/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { emitRockerEvent } from '@/lib/ai/rocker/bus';
import { useRockerEvent } from '@/hooks/useRockerEvent';

const emailSchema = z.string().email('Invalid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(128);

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'login') as AuthMode;
  const next = searchParams.get('next') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();
  const { emit: emitRockerTelemetry } = useRockerEvent();

  // Log auth page view
  useEffect(() => {
    emitRockerTelemetry('auth.page_view', { metadata: { mode, source: next } });
  }, [mode, next]);

  // Guard: If already authenticated, redirect to home or next
  useEffect(() => {
    if (session) {
      navigate(next, { replace: true });
    }
  }, [session, navigate, next]);

  const setMode = (newMode: AuthMode) => {
    const params = new URLSearchParams(searchParams);
    params.set('mode', newMode);
    setSearchParams(params, { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    
    if (!emailResult.success) {
      emitRockerTelemetry('auth.validation_error', { metadata: { mode: 'signup', field: 'email', error: emailResult.error.errors[0].message } });
      toast({ title: emailResult.error.errors[0].message, variant: 'destructive' });
      return;
    }
    if (!passwordResult.success) {
      emitRockerTelemetry('auth.validation_error', { metadata: { mode: 'signup', field: 'password', error: passwordResult.error.errors[0].message } });
      toast({ title: passwordResult.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    try {
      const { error, session: newSession } = await signUpWithPassword(email, password);
      if (error) throw error;
      
      // Log successful signup to Rocker
      await emitRockerEvent('user.create.profile', newSession?.userId || 'unknown', {
        email,
        source: next,
        duration_ms: Date.now() - startTime,
      });
      emitRockerTelemetry('auth.signup_success', { metadata: { email, duration_ms: Date.now() - startTime } });
      
      toast({ title: '✓ Account created', description: 'You can now sign in' });
      setMode('login');
      setPassword('');
    } catch (err) {
      // Log failure to Rocker
      emitRockerTelemetry('auth.signup_error', { 
        metadata: { 
          email, 
          error: err instanceof Error ? err.message : 'Unknown error',
          duration_ms: Date.now() - startTime 
        }
      });
      
      toast({
        title: 'Sign up failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    
    if (!emailResult.success) {
      emitRockerTelemetry('auth.validation_error', { metadata: { mode: 'login', field: 'email', error: emailResult.error.errors[0].message } });
      toast({ title: emailResult.error.errors[0].message, variant: 'destructive' });
      return;
    }
    if (!passwordResult.success) {
      emitRockerTelemetry('auth.validation_error', { metadata: { mode: 'login', field: 'password', error: passwordResult.error.errors[0].message } });
      toast({ title: passwordResult.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    try {
      const { error, session: newSession } = await signInWithPassword(email, password);
      if (error) throw error;
      
      // Log successful login to Rocker
      await emitRockerEvent('user.view.profile', newSession?.userId || 'unknown', {
        email,
        source: next,
        duration_ms: Date.now() - startTime,
        returning_user: true,
      });
      emitRockerTelemetry('auth.login_success', { metadata: { email, duration_ms: Date.now() - startTime } });
      
      toast({ title: '✓ Signed in' });
      navigate(next, { replace: true });
    } catch (err) {
      // Log failure to Rocker
      emitRockerTelemetry('auth.login_error', { 
        metadata: { 
          email, 
          error: err instanceof Error ? err.message : 'Invalid credentials',
          duration_ms: Date.now() - startTime 
        }
      });
      
      toast({
        title: 'Sign in failed',
        description: err instanceof Error ? err.message : 'Invalid credentials',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      emitRockerTelemetry('auth.validation_error', { metadata: { mode: 'reset', field: 'email', error: emailResult.error.errors[0].message } });
      toast({ title: emailResult.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=login`
      });
      if (error) throw error;
      
      // Log password reset to Rocker
      emitRockerTelemetry('auth.reset_success', { metadata: { email, duration_ms: Date.now() - startTime } });
      
      toast({ 
        title: '✓ Check your email', 
        description: 'Password reset link sent' 
      });
      setMode('login');
    } catch (err) {
      // Log failure to Rocker
      emitRockerTelemetry('auth.reset_error', { 
        metadata: { 
          email, 
          error: err instanceof Error ? err.message : 'Unknown error',
          duration_ms: Date.now() - startTime 
        }
      });
      
      toast({
        title: 'Reset failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHelmet title="Sign In" description="Sign in to Y'alls.ai" />
      
      {/* Mac-style full-screen container */}
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        {/* Header - Back to home */}
        <Link 
          to="/"
          className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Auth Card - Mac glass style */}
        <Card className="w-full max-w-md relative z-10 bg-background/80 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center border-b border-border/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'reset' && 'Reset Password'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' && 'Sign in to continue to Y\'alls.ai'}
              {mode === 'signup' && 'Join the equestrian social network'}
              {mode === 'reset' && 'Enter your email to receive a reset link'}
            </p>
          </div>

          {/* Mode Tabs */}
          {mode !== 'reset' && (
            <div className="flex border-b border-border/40">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                  mode === 'login'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
                {mode === 'login' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                  mode === 'signup'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
                {mode === 'signup' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          )}

          {/* Form */}
          <div className="p-8">
            <form onSubmit={mode === 'reset' ? handleReset : mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 bg-muted/50 border-border/40 focus:border-primary/40 focus:ring-primary/20"
                />
              </div>
              
              {mode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="h-11 bg-muted/50 border-border/40 focus:border-primary/40 focus:ring-primary/20"
                  />
                  {mode === 'signup' && (
                    <p className="text-xs text-muted-foreground">
                      At least 6 characters
                    </p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 font-medium shadow-lg hover:shadow-xl transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {mode === 'reset' ? 'Sending...' : mode === 'signup' ? 'Creating...' : 'Signing in...'}
                  </span>
                ) : (
                  <>
                    {mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>

            {/* Footer links */}
            <div className="mt-6 text-center text-sm space-y-2">
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => setMode('reset')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                  <div className="text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}
              {mode === 'signup' && (
                <div className="text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              )}
              {mode === 'reset' && (
                <button
                  onClick={() => setMode('login')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="fixed bottom-6 left-0 right-0 text-center text-xs text-muted-foreground z-50">
          <p>
            By continuing, you agree to our{' '}
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </>
  );
}

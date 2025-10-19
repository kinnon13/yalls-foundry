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
import { ArrowLeft, Sparkles, Mail, Apple } from 'lucide-react';
import { emitEvent } from '@/lib/telemetry/events';

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { session } = useSession();
  const navigate = useNavigate();

  // Log auth page view
  useEffect(() => {
    emitEvent('auth_view', { mode, next });
  }, [mode, next]);

  // Guard: If already authenticated, redirect to next or home
  useEffect(() => {
    if (session) {
      const destination = next && next !== '/' ? next : '/home?tab=for-you';
      navigate(destination, { replace: true });
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
      emitEvent('auth_error', { mode: 'signup', field: 'email', error: emailResult.error.errors[0].message });
      toast({ title: emailResult.error.errors[0].message, variant: 'destructive' });
      return;
    }
    if (!passwordResult.success) {
      emitEvent('auth_error', { mode: 'signup', field: 'password', error: passwordResult.error.errors[0].message });
      toast({ title: passwordResult.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    emitEvent('auth_submit', { mode: 'signup' });
    
    try {
      const { error } = await signUpWithPassword(email, password);
      if (error) throw error;
      
      // Show confirmation screen
      emitEvent('auth_success', { mode: 'signup' });
      setShowConfirmation(true);
      
    } catch (err) {
      emitEvent('auth_error', { 
        mode: 'signup',
        error: err instanceof Error ? err.message : 'Unknown error'
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
      emitEvent('auth_error', { mode: 'login', field: 'email', error: emailResult.error.errors[0].message });
      toast({ title: emailResult.error.errors[0].message, variant: 'destructive' });
      return;
    }
    if (!passwordResult.success) {
      emitEvent('auth_error', { mode: 'login', field: 'password', error: passwordResult.error.errors[0].message });
      toast({ title: passwordResult.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    emitEvent('auth_submit', { mode: 'login' });
    
    try {
      const { error, session: newSession } = await signInWithPassword(email, password);
      if (error) throw error;
      
      // Profile bootstrap: ensure profile exists
      if (newSession?.userId) {
        await bootstrapProfile(newSession.userId, email);
      }
      
      emitEvent('auth_success', { mode: 'login' });
      toast({ title: '✓ Signed in' });
      
      const destination = next && next !== '/' ? next : '/home?tab=for-you';
      navigate(destination, { replace: true });
    } catch (err) {
      emitEvent('auth_error', { 
        mode: 'login',
        error: err instanceof Error ? err.message : 'Invalid credentials'
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
      emitEvent('auth_error', { mode: 'reset', field: 'email', error: emailResult.error.errors[0].message });
      toast({ title: emailResult.error.errors[0].message, variant: 'destructive' });
      return;
    }

    setLoading(true);
    emitEvent('auth_submit', { mode: 'reset' });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=login`
      });
      if (error) throw error;
      
      emitEvent('auth_success', { mode: 'reset' });
      setShowConfirmation(true);
      
    } catch (err) {
      emitEvent('auth_error', { 
        mode: 'reset',
        error: err instanceof Error ? err.message : 'Unknown error'
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

  const handleSSO = async (provider: 'google' | 'apple') => {
    setLoading(true);
    emitEvent('auth_submit', { mode: 'sso', provider });
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${next || '/home?tab=for-you'}`
        }
      });
      
      if (error) throw error;
      emitEvent('auth_success', { mode: 'sso', provider });
    } catch (err) {
      emitEvent('auth_error', { mode: 'sso', provider, error: err instanceof Error ? err.message : 'SSO failed' });
      toast({
        title: 'SSO failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  // Bootstrap profile on first login
  const bootstrapProfile = async (userId: string, userEmail: string) => {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!existing) {
        await supabase.from('profiles').upsert({
          user_id: userId,
          display_name: null,
          handle: null,
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('[Auth] Profile bootstrap error:', err);
    }
  };

  // Confirmation screen after signup/reset
  if (showConfirmation) {
    return (
      <>
        <SEOHelmet title="Check Your Email" description="Verification email sent" />
        
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center bg-background/80 backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-muted-foreground mb-6">
              {mode === 'signup' 
                ? `We sent a confirmation link to ${email}. Click the link to activate your account.`
                : `We sent a password reset link to ${email}. Click the link to reset your password.`
              }
            </p>
            
            <p className="text-sm text-muted-foreground mb-6">
              Didn't receive it? Check your spam folder or{' '}
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-primary font-medium hover:underline"
              >
                try again
              </button>
            </p>
            
            <Button 
              onClick={() => {
                setShowConfirmation(false);
                setMode('login');
              }}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </Card>
        </div>
      </>
    );
  }

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
            {/* SSO Buttons - Only for login/signup */}
            {mode !== 'reset' && (
              <div className="space-y-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 font-medium"
                  onClick={() => handleSSO('google')}
                  disabled={loading}
                  data-testid="sso-google"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 font-medium"
                  onClick={() => handleSSO('apple')}
                  disabled={loading}
                  data-testid="sso-apple"
                >
                  <Apple className="w-5 h-5 mr-2" />
                  Continue with Apple
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/40" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
              </div>
            )}
            
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

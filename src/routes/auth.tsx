/**
 * Unified Auth Page - Single canonical entry point
 * Modes: login | signup | reset
 * Mac-style design with glass morphism
 */

import { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, Sparkles, Mail, Apple, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { emitEvent } from '@/lib/telemetry/events';
import { CaptchaGuard } from '@/components/auth/CaptchaGuard';

const emailSchema = z.string().email('Invalid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(128);

type AuthMode = 'login' | 'signup' | 'reset' | 'update-password';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'login') as AuthMode;
  const next = searchParams.get('next') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [needsCaptcha, setNeedsCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { session } = useSession();
  const navigate = useNavigate();
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Log auth page view
  useEffect(() => {
    emitEvent('auth_view', { mode, next });
  }, [mode, next]);

  // Guard: If already authenticated, redirect to next or home (but not during password reset flow)
  useEffect(() => {
    if (session && !['update-password', 'reset'].includes(mode)) {
      const destination = next && next !== '/' ? next : '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [session, navigate, next, mode]);

  const setMode = (newMode: AuthMode) => {
    const params = new URLSearchParams(searchParams);
    params.set('mode', newMode);
    setSearchParams(params, { replace: true });
  };

  // Listen for recovery link and switch to update-password mode
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update-password');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check rate limit before auth attempt
  const checkRateLimit = async (identifier: string) => {
    try {
      const { data, error } = await supabase.rpc('check_auth_rate_limit', {
        p_identifier: identifier
      });
      
      if (error) throw error;
      
      const rateLimitData = data as any;
      setRateLimitInfo(rateLimitData);
      setNeedsCaptcha(rateLimitData?.needs_captcha || false);
      
      return rateLimitData || { allowed: true, needs_captcha: false };
    } catch (err) {
      console.error('[Auth] Rate limit check failed:', err);
      return { allowed: true, needs_captcha: false }; // Fail open
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    
    const validationErrors: Record<string, string> = {};
    
    if (!emailResult.success) {
      validationErrors.email = emailResult.error.errors[0].message;
      emitEvent('auth_error', { mode: 'signup', field: 'email', error: emailResult.error.errors[0].message });
    }
    if (!passwordResult.success) {
      validationErrors.password = passwordResult.error.errors[0].message;
      emitEvent('auth_error', { mode: 'signup', field: 'password', error: passwordResult.error.errors[0].message });
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      errorSummaryRef.current?.focus();
      toast({ title: 'Please fix the errors below', variant: 'destructive' });
      return;
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(email);
    if (!rateLimit.allowed) {
      emitEvent('auth_rate_limited', { mode: 'signup', email });
      toast({
        title: 'Too many attempts',
        description: `Please wait ${Math.ceil(rateLimit.retry_after / 60)} minutes before trying again`,
        variant: 'destructive'
      });
      return;
    }
    
    // Require CAPTCHA if needed
    if (rateLimit.needs_captcha && !captchaToken) {
      setNeedsCaptcha(true);
      emitEvent('auth_captcha_shown', { mode: 'signup' });
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
    
    // Clear previous errors
    setErrors({});
    
    // Validate
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    
    const validationErrors: Record<string, string> = {};
    
    if (!emailResult.success) {
      validationErrors.email = emailResult.error.errors[0].message;
      emitEvent('auth_error', { mode: 'login', field: 'email', error: emailResult.error.errors[0].message });
    }
    if (!passwordResult.success) {
      validationErrors.password = passwordResult.error.errors[0].message;
      emitEvent('auth_error', { mode: 'login', field: 'password', error: passwordResult.error.errors[0].message });
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      errorSummaryRef.current?.focus();
      toast({ title: 'Please fix the errors below', variant: 'destructive' });
      return;
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(email);
    if (!rateLimit.allowed) {
      emitEvent('auth_rate_limited', { mode: 'login', email });
      toast({
        title: 'Too many attempts',
        description: `Please wait ${Math.ceil(rateLimit.retry_after / 60)} minutes before trying again`,
        variant: 'destructive'
      });
      return;
    }
    
    // Require CAPTCHA if needed
    if (rateLimit.needs_captcha && !captchaToken) {
      setNeedsCaptcha(true);
      emitEvent('auth_captcha_shown', { mode: 'login' });
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
      
      // Reset rate limit on successful login
      await supabase.rpc('reset_auth_rate_limit', { p_identifier: email });
      
      emitEvent('auth_success', { mode: 'login' });
      toast({ title: '✓ Signed in' });
      
      const destination = next && next !== '/' ? next : '/dashboard';
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
        redirectTo: `${window.location.origin}/auth?mode=update-password`
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setErrors({ password: passwordResult.error.errors[0].message });
      emitEvent('auth_error', { mode: 'update-password', field: 'password', error: passwordResult.error.errors[0].message });
      return;
    }

    setLoading(true);
    emitEvent('auth_submit', { mode: 'update-password' });
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      emitEvent('auth_success', { mode: 'update-password' });
      toast({ title: '✓ Password updated successfully' });
      
      // Redirect to home after successful password update
      navigate('/home?tab=for-you', { replace: true });
    } catch (err) {
      emitEvent('auth_error', { 
        mode: 'update-password',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again',
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

  // CAPTCHA screen
  if (needsCaptcha && !captchaToken) {
    return (
      <>
        <SEOHelmet title="Security Check" description="Verify you're human" />
        
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
          <CaptchaGuard
            onVerified={(token) => {
              setCaptchaToken(token);
              setNeedsCaptcha(false);
              emitEvent('auth_captcha_pass', { mode });
              toast({ title: '✓ Verified' });
            }}
            onSkip={() => {
              setNeedsCaptcha(false);
              setCaptchaToken(null);
            }}
          />
        </div>
      </>
    );
  }

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
              {mode === 'update-password' && 'Set New Password'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' && 'Sign in to continue to Y\'alls.ai'}
              {mode === 'signup' && 'Join the equestrian social network'}
              {mode === 'reset' && 'Enter your email to receive a reset link'}
              {mode === 'update-password' && 'Choose a strong password for your account'}
            </p>
          </div>

          {/* Mode Tabs */}
          {mode !== 'reset' && mode !== 'update-password' && (
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
            {mode !== 'reset' && mode !== 'update-password' && (
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
            
            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-destructive mb-1">
                      Please fix the following errors:
                    </p>
                    <ul className="list-disc list-inside text-sm text-destructive/80 space-y-1">
                      {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limit Warning */}
            {rateLimitInfo && rateLimitInfo.remaining <= 3 && rateLimitInfo.remaining > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning">
                  ⚠️ {rateLimitInfo.remaining} attempts remaining
                </p>
              </div>
            )}
            
            <form onSubmit={mode === 'update-password' ? handleUpdatePassword : mode === 'reset' ? handleReset : mode === 'signup' ? handleSignUp : handleSignIn} className="space-y-4">
              {mode !== 'update-password' && (
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
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="h-11 bg-muted/50 border-border/40 focus:border-primary/40 focus:ring-primary/20"
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>
              )}
              
              {mode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      className="h-11 bg-muted/50 border-border/40 focus:border-primary/40 focus:ring-primary/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p id="password-error" className="text-sm text-destructive">
                      {errors.password}
                    </p>
                  ) : mode === 'signup' ? (
                    <p className="text-xs text-muted-foreground">
                      At least 6 characters
                    </p>
                  ) : null}
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
                    {mode === 'update-password' ? 'Updating...' : mode === 'reset' ? 'Sending...' : mode === 'signup' ? 'Creating...' : 'Signing in...'}
                  </span>
                ) : (
                  <>
                    {mode === 'update-password' ? 'Update Password' : mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
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
              {mode === 'update-password' && (
                <p className="text-muted-foreground text-xs">
                  Enter your new password below
                </p>
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

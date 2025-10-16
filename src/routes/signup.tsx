import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpWithPassword } from '@/lib/auth/adapters/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { SEOHelmet } from '@/lib/seo/helmet';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consentAccepted) {
      toast.error('Please accept the Terms & Privacy Policy to continue');
      return;
    }
    
    setLoading(true);

    try {
      const { session, error } = await signUpWithPassword(email, password);
      
      if (error) {
        toast.error(error.message);
        return;
      }

      if (session) {
        toast.success('Account created successfully!');
        navigate('/');
      } else {
        toast.success('Check your email to confirm your account');
      }
    } catch (err) {
      toast.error('Failed to sign up');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHelmet title="Sign Up" description="Create your yalls.ai account" />
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Sign up to access yalls.ai features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters with 1 uppercase letter and 1 number
                </p>
              </div>
              
              <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/5">
                <Checkbox
                  id="consent"
                  checked={consentAccepted}
                  onCheckedChange={(checked) => setConsentAccepted(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="consent" className="font-medium cursor-pointer text-sm leading-tight">
                    I agree to the Terms of Service, Privacy Policy, and allow platform communications (SMS, email, push notifications) and AI features
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    You can change these preferences anytime in Settings → Privacy
                  </p>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || !consentAccepted}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

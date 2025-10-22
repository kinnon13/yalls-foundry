import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRockerGreeting } from '@/hooks/useRockerGreeting';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Users, DollarSign, Shield, Zap, MessageSquare } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Equestrian Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Yalls.ai</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The complete platform for equestrian professionals. Connect, sell, manage, and grow your business with AI assistance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            {isLoggedIn ? (
              <Button onClick={() => navigate('/dashboard')} size="lg" className="text-lg px-8 py-6">
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button onClick={() => navigate('/auth?mode=signup')} size="lg" className="text-lg px-8 py-6">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button onClick={() => navigate('/auth?mode=login')} variant="outline" size="lg" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need in one place</h2>
            <p className="text-xl text-muted-foreground">Built for producers, trainers, and equestrian businesses</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MessageSquare className="w-8 h-8" />}
              title="AI Assistant"
              description="Get instant help with business decisions, scheduling, and customer communication"
            />
            <FeatureCard 
              icon={<DollarSign className="w-8 h-8" />}
              title="Marketplace"
              description="Sell products and services with built-in payment processing and MLM commissions"
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title="Network Growth"
              description="Build your downline and earn commissions on your network's sales"
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8" />}
              title="Business Management"
              description="CRM, calendar, approvals, and operations all in one dashboard"
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8" />}
              title="Instant Payments"
              description="Fast, secure payouts with automatic commission calculations"
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8" />}
              title="Smart Analytics"
              description="Track earnings, network growth, and business metrics in real-time"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isLoggedIn && (
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-12 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl text-muted-foreground mb-8">Join the platform built for equestrian success</p>
            <Button onClick={() => navigate('/auth?mode=signup')} size="lg" className="text-lg px-8 py-6">
              Create Your Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;

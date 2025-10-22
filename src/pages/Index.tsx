/**
 * 🔒 PRODUCTION-LOCKED LANDING PAGE
 * DO NOT MODIFY without explicit user approval
 * Last finalized: 2025-01-22
 * 
 * Landing Page - Marketing welcome page for Yalls.ai
 * Supports domain-based routing for vertical-specific messaging
 */

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
    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    // Then check current session (do NOT redirect; allow viewing landing while logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Yalls.ai</span>
          </div>
          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Button onClick={() => navigate('/auth?mode=login')} variant="ghost">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth?mode=signup')}>
                  Get Started
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              The Equestrian Business Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              Grow Your Equestrian
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                Business with AI
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              The all-in-one platform for producers, trainers, and equestrian professionals. 
              Marketplace, CRM, payments, and AI assistance built for your success.
            </p>
            
            {!isLoggedIn && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button 
                  onClick={() => navigate('/auth?mode=signup')} 
                  size="lg" 
                  className="text-lg px-10 py-7 shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  onClick={() => navigate('/auth?mode=login')} 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-10 py-7"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">Run your entire equestrian business from one platform</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<DollarSign className="w-10 h-10" />}
                title="Marketplace & Payments"
                description="Sell products, services, and events with instant payment processing. MLM commissions built-in."
              />
              <FeatureCard 
                icon={<Users className="w-10 h-10" />}
                title="Network & Downline"
                description="Build your team and earn commissions on your entire network's sales automatically."
              />
              <FeatureCard 
                icon={<MessageSquare className="w-10 h-10" />}
                title="AI Assistant"
                description="Get instant help with scheduling, customer communication, and business decisions."
              />
              <FeatureCard 
                icon={<Shield className="w-10 h-10" />}
                title="Business Management"
                description="CRM, calendar, approvals, and farm operations all in one powerful dashboard."
              />
              <FeatureCard 
                icon={<Zap className="w-10 h-10" />}
                title="Instant Analytics"
                description="Track earnings, network growth, and performance metrics in real-time."
              />
              <FeatureCard 
                icon={<Sparkles className="w-10 h-10" />}
                title="Smart Automation"
                description="Automate follow-ups, reminders, and routine tasks to save hours every day."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
        <section className="py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your Business?</h2>
              <p className="text-xl text-muted-foreground">Join thousands of equestrian professionals already on Yalls.ai</p>
              <Button 
                onClick={() => navigate('/auth?mode=signup')} 
                size="lg"
                className="text-lg px-10 py-7 shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-sm text-muted-foreground">No credit card required · 14-day free trial</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">Yalls.ai</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <button onClick={() => navigate('/privacy')}>Privacy</button>
              <button onClick={() => navigate('/terms')}>Terms</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-8 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-card/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default Index;

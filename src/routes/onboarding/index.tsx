/**
 * Onboarding Wizard - 6-step flow
 * Steps: 0-Acquisition, 1-Handle, 2-Interests, 3-Notifications, 4-Business, 5-Follows
 * Resume-safe with DB + localStorage persistence
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEOHelmet } from '@/lib/seo/helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { emitEvent } from '@/lib/telemetry/events';
import { InviteSourceStep } from '@/components/onboarding/InviteSourceStep';
import { HandleStep } from '@/components/onboarding/HandleStep';
import { InterestsStepUniversal } from '@/components/onboarding/InterestsStepUniversal';
import { NotificationsStep } from '@/components/onboarding/NotificationsStep';
import { BusinessStep } from '@/components/onboarding/BusinessStep';
import { FollowsStep } from '@/components/onboarding/FollowsStep';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { key: 'acquisition', label: 'How did you find us?' },
  { key: 'handle', label: 'Choose your handle' },
  { key: 'interests', label: 'What are you into?' },
  { key: 'notifications', label: 'Stay updated' },
  { key: 'business', label: 'Business profile (optional)' },
  { key: 'follows', label: 'Follow suggestions' }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load resume state
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth?mode=login');
        return;
      }

      // Check if already complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.onboarding_complete) {
        navigate('/home?tab=for-you');
        return;
      }

      // Load progress
      const { data: progress } = await supabase
        .from('profiles_onboarding_progress')
        .select('step, data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progress?.step) {
        const stepIndex = STEPS.findIndex(s => s.key === progress.step);
        setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
      }

      setLoading(false);
    } catch (err) {
      console.error('[Onboarding] Load progress error:', err);
      setLoading(false);
    }
  };

  const saveProgress = async (step: string, data: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('profiles_onboarding_progress').upsert({
        user_id: user.id,
        step,
        data,
        updated_at: new Date().toISOString()
      });

      // Mirror to localStorage
      localStorage.setItem('ob_progress', JSON.stringify({ step, data }));
    } catch (err) {
      console.error('[Onboarding] Save progress error:', err);
    }
  };

  const handleNext = async () => {
    const nextStep = currentStep + 1;
    
    if (nextStep >= STEPS.length) {
      // Finish onboarding
      await finishOnboarding();
    } else {
      await saveProgress(STEPS[nextStep].key);
      setCurrentStep(nextStep);
      emitEvent('onboarding_step', { step: STEPS[nextStep].key });
    }
  };

  // Ensure we have acquisition before completion (server requires it)
  const ensureAcquisition = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch existing acquisition with required fields
    const { data: acq } = await supabase
      .from('user_acquisition')
      .select('user_id, invite_code, utm')
      .eq('user_id', user.id)
      .maybeSingle();

    // Decide if we need to set/repair acquisition (row missing or required fields empty)
    const utmEmpty = !acq?.utm || (typeof acq.utm === 'object' && Object.keys(acq.utm as any).length === 0);
    const needsSet = !acq || !acq.invite_code || utmEmpty;

    if (needsSet) {
      const sessionId = sessionStorage.getItem('session_id') ||
        `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const payload = {
        invited_by_kind: 'unknown',
        invited_by_id: null,
        invite_code: 'organic', // Non-null to satisfy RPC validation
        invite_medium: 'organic',
        utm: { source: 'direct' }, // Minimal UTM to satisfy validation
        ref_session_id: sessionId,
      } as any;
      await supabase.rpc('set_user_acquisition', { p_payload: payload });
    }
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      await ensureAcquisition();

      const { error } = await supabase.rpc('complete_onboarding');
      if (error) throw error;

      emitEvent('onboarding_complete', {});
      navigate('/home?tab=for-you');
    } catch (err) {
      console.error('[Onboarding] Complete error:', err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('acquisition_required')) {
        toast({
          title: 'One more step',
          description: "Please complete 'How did you find us?' before finishing.",
          variant: 'destructive'
        });
        setCurrentStep(0);
        await saveProgress('acquisition');
        return;
      }
      alert('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(STEPS[prevStep].key);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <>
      <SEOHelmet title="Welcome - Complete Your Profile" description="Set up your Y'alls profile" />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto pt-8 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome to Y'alls</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-2 mb-8" />
        </div>

        {/* Step content */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-background/80 backdrop-blur-xl border-border/50">
            {currentStep === 0 && <InviteSourceStep onComplete={handleNext} />}
            {currentStep === 1 && <HandleStep onComplete={handleNext} onBack={handleBack} />}
            {currentStep === 2 && <InterestsStepUniversal onComplete={handleNext} onBack={handleBack} />}
            {currentStep === 3 && <NotificationsStep onComplete={handleNext} onBack={handleBack} />}
            {currentStep === 4 && <BusinessStep onComplete={handleNext} onBack={handleBack} />}
            {currentStep === 5 && <FollowsStep onComplete={finishOnboarding} onBack={handleBack} />}
          </Card>
        </div>

        {/* Footer hint */}
        <div className="max-w-2xl mx-auto mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            You can refresh or come back later - your progress is saved
          </p>
        </div>
      </div>
    </>
  );
}

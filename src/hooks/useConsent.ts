import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ConsentStatus {
  site_opt_in: boolean;
  policy_version_current: string | null;
  policy_version_required: string | null;
  needs_consent: boolean;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  push_opt_in: boolean;
  proactive_enabled: boolean;
}

export function useConsent() {
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkConsent();
  }, []);

  async function checkConsent() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('consent-status');
      if (error) throw error;

      setStatus(data);
      
      // Redirect to consent page if needed and not already there
      if (data.needs_consent && window.location.pathname !== '/consent') {
        navigate('/consent');
      }
    } catch (error) {
      console.error('Error checking consent:', error);
    } finally {
      setLoading(false);
    }
  }

  async function acceptConsent(options: {
    policy_version: string;
    sms_opt_in?: boolean;
    email_opt_in?: boolean;
    push_opt_in?: boolean;
    proactive_enabled?: boolean;
    scopes?: string[];
  }) {
    const { error } = await supabase.functions.invoke('consent-accept', {
      body: options
    });
    
    if (error) throw error;
    await checkConsent();
    return { ok: true };
  }

  async function revokeConsent() {
    const { error } = await supabase.functions.invoke('consent-revoke');
    if (error) throw error;
    await checkConsent();
    return { ok: true };
  }

  return {
    status,
    loading,
    checkConsent,
    acceptConsent,
    revokeConsent
  };
}
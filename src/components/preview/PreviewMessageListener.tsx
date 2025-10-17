import { usePreviewMessage } from '@/preview/usePreviewMessage';
import type { PreviewEvent } from '@/preview/schema';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Global listener for preview messages with server-side audit trail
 * Validates + audits all preview interactions
 */
export function PreviewMessageListener() {
  usePreviewMessage(async (event: PreviewEvent) => {
    console.log('[PreviewMessage] Validated event:', event);

    // Audit to server (fail silently - don't block UI)
    try {
      await supabase.functions.invoke('audit-preview-event', {
        body: {
          event_type: event.type,
          source: event.source,
          payload: event,
          route: window.location.pathname,
          user_agent: navigator.userAgent,
        },
      });
    } catch (auditError) {
      console.error('[PreviewMessage] Audit failed:', auditError);
    }

    // Handle by source
    switch (event.source) {
      case 'pay-preview':
        handlePayMessage(event);
        break;
      case 'admin-preview':
        handleAdminMessage(event);
        break;
      case 'data-preview':
        handleDataMessage(event);
        break;
      case 'app-preview':
        handleAppMessage(event);
        break;
      case 'preview-security':
        handleSecurityEvent(event);
        break;
    }
  });

  return null;
}

function handlePayMessage(event: PreviewEvent) {
  if (event.source !== 'pay-preview') return;

  switch (event.type) {
    case 'PAYMENT_SUCCESS':
      toast({
        title: 'Payment Success (Preview)',
        description: `Order ${event.orderId} paid successfully`,
      });
      // In production: poll order status, update UI
      break;

    case 'PAYMENT_FAIL':
      toast({
        title: 'Payment Failed (Preview)',
        description: event.reason || 'Payment was declined',
        variant: 'destructive',
      });
      break;

    case 'KYC_COMPLETE':
      toast({
        title: 'KYC Complete (Preview)',
        description: 'Account onboarding finished',
      });
      // In production: update user's seller status
      break;

    case 'LABEL_PURCHASED':
      toast({
        title: 'Label Purchased (Preview)',
        description: `Order ${event.orderId} - Tracking: ${event.tracking}`,
      });
      // CRITICAL: This unlocks affiliate commissions for tangible goods
      // In production: mark order "label_printed" → triggers commission payout eligibility
      break;
  }
}

function handleAdminMessage(event: PreviewEvent) {
  if (event.source !== 'admin-preview') return;
  
  toast({
    title: 'Admin Action (Preview)',
    description: `${event.type} received`,
  });
}

function handleDataMessage(event: PreviewEvent) {
  if (event.source !== 'data-preview') return;

  toast({
    title: 'Data Action (Preview)',
    description: `${event.type} received`,
  });
}

function handleAppMessage(event: PreviewEvent) {
  if (event.source !== 'app-preview') return;

  toast({
    title: 'App Action (Preview)',
    description: `${event.type} received`,
  });
}

function handleSecurityEvent(event: PreviewEvent) {
  if (event.source !== 'preview-security') return;
  
  if (event.type === 'BLOCKED_WRITE') {
    toast({
      title: '🛡️ Write Blocked (Preview)',
      description: `${event.method} to ${event.url || 'unknown'} was blocked`,
      variant: 'destructive',
    });
    
    console.warn('[PreviewSecurity] Blocked write attempt:', {
      method: event.method,
      url: event.url,
      timestamp: event.timestamp,
    });
  }
}

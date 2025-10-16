import { useEffect } from 'react';
import { usePreviewMessage, type PreviewEvent } from '@/preview/usePreviewMessage';
import { toast } from '@/hooks/use-toast';

/**
 * Global listener for preview hand-off messages
 * Mount this once in App.tsx to handle all preview interactions
 */
export function PreviewMessageListener() {
  usePreviewMessage((event: PreviewEvent) => {
    console.log('[PreviewMessage] Received:', event);

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
    }
  });

  return null; // No UI
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

/**
 * Rocker Approval Helpers
 * Utilities for sending approval requests via multiple channels
 */

import { supabase } from '@/integrations/supabase/client';
import { initiateVoiceCall, sendVoiceMessage, sendSMS } from './voice';

export interface ApprovalRequest {
  type: 'change_proposal' | 'promotion_queue';
  id: string;
  title: string;
  description: string;
  urgency?: 'low' | 'medium' | 'high';
}

/**
 * Send multi-channel approval notification
 * Generates link, sends via chat, optionally SMS/voice
 */
export async function sendApprovalRequest(
  request: ApprovalRequest,
  channels: {
    chat?: boolean;
    sms?: boolean;
    voice_message?: boolean;
    voice_call?: boolean;
  } = { chat: true }
) {
  const approvalLink = `${window.location.origin}/admin/approvals?highlight=${request.id}`;
  
  const message = `🔔 New ${request.type === 'change_proposal' ? 'Change Proposal' : 'Knowledge Promotion'} requires approval:

"${request.title}"

${request.description}

${approvalLink}`;

  const results: any = {
    link: approvalLink,
    channels_used: [],
  };

  // Always log to chat
  if (channels.chat) {
    results.channels_used.push('chat');
  }

  // Send SMS if requested
  if (channels.sms) {
    try {
      await sendSMS({
        message: `Rocker: ${request.title}\n\nApprove here: ${approvalLink}`,
        metadata: { approval_id: request.id, type: 'approval_request' },
      });

      results.channels_used.push('sms');
    } catch (err) {
      console.error('SMS send failed:', err);
    }
  }

  // Send voice message if requested
  if (channels.voice_message) {
    try {
      const voiceScript = `You have a new ${
        request.type === 'change_proposal' ? 'change proposal' : 'knowledge promotion request'
      } titled: ${request.title}. ${request.description}. Please check your dashboard to review and approve.`;

      const voiceData = await sendVoiceMessage({
        message: voiceScript,
      });

      results.channels_used.push('voice_message');
      results.voice_url = voiceData.audio_url;
    } catch (err) {
      console.error('Voice message failed:', err);
    }
  }

  // Initiate voice call for high urgency
  if (channels.voice_call && request.urgency === 'high') {
    try {
      const callData = await initiateVoiceCall({
        message: `urgent ${request.type === 'change_proposal' ? 'change proposal' : 'knowledge promotion'}`,
        approvalId: request.id,
      });

      results.channels_used.push('voice_call');
      results.call_sid = callData.call_sid;
    } catch (err) {
      console.error('Voice call failed:', err);
    }
  }

  return results;
}

/**
 * Format approval link for chat messages
 */
export function formatApprovalLink(request: ApprovalRequest): string {
  const approvalLink = `${window.location.origin}/admin/approvals?highlight=${request.id}`;
  
  return `🔗 **[Approve/Reject Here](${approvalLink})**

Or reply with:
• "approve" to approve
• "reject" to reject
• "call me" for voice discussion`;
}

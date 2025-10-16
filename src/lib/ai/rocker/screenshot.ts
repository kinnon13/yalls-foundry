/**
 * Screenshot Capture Utility
 * Captures page state during Rocker learning for debugging
 */

import { supabase } from '@/integrations/supabase/client';

export async function captureScreenshot(
  context: {
    action: string;
    target: string;
    success: boolean;
    message: string;
    selector?: string;
    route: string;
  },
  userId: string
): Promise<string | null> {
  try {
    // Use html2canvas for screenshot capture
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(document.body, {
      scale: 0.5, // Reduce size for storage
      logging: false,
      useCORS: true,
    });

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.7);
    });

    // Upload to Supabase Storage
    const fileName = `rocker-learning/${userId}/${Date.now()}-${context.action}.jpg`;
    const { data, error } = await supabase.storage
      .from('ai-screenshots')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (error) {
      console.error('Failed to upload screenshot:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ai-screenshots')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Screenshot capture failed:', err);
    return null;
  }
}

export async function logActionWithScreenshot(
  action: string,
  target: string,
  success: boolean,
  message: string,
  userId: string,
  options?: {
    selector?: string;
    route?: string;
    captureScreenshot?: boolean;
    meta?: any;
  }
): Promise<void> {
  const route = options?.route || location.pathname;
  let screenshotUrl: string | null = null;

  // Capture screenshot for failures or if explicitly requested
  if (options?.captureScreenshot !== false && (!success || options?.captureScreenshot)) {
    screenshotUrl = await captureScreenshot(
      { action, target, success, message, selector: options?.selector, route },
      userId
    );
  }

  // Store in ai_feedback table
  const { error } = await supabase.from('ai_feedback').insert({
    user_id: userId,
    action,
    target,
    success,
    message,
    screenshot_url: screenshotUrl,
    selector: options?.selector,
    route,
    meta: options?.meta || {},
    kind: 'dom_action',
    payload: {
      action,
      target,
      success,
      message,
    },
  });
}

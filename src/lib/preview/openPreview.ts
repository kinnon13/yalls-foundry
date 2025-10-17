import { supabase } from '@/integrations/supabase/client';

/**
 * Open preview window with server-signed HMAC token for secure postMessage
 * Parent uses this to launch previews
 */
export async function openPreviewWindow(path: string): Promise<Window | null> {
  const parentOrigin = window.location.origin;
  
  try {
    // Fetch server-signed HMAC token
    const { data, error } = await supabase.functions.invoke('sign-preview-token', {
      body: { parentOrigin, ttlSeconds: 300 },
    });

    if (error || !data?.tk) {
      console.error('[PreviewWindow] Failed to get signed token:', error);
      return null;
    }

    // Build URL with token params
    const url = new URL(path, parentOrigin);
    url.searchParams.set('parent', parentOrigin);
    url.searchParams.set('tk', data.tk);
    url.searchParams.set('exp', data.exp.toString());
    
    // Open in new window
    const windowFeatures = 'width=480,height=720,resizable=yes,scrollbars=yes';
    const previewWindow = window.open(url.toString(), 'preview', windowFeatures);
    
    if (!previewWindow) {
      console.error('[PreviewWindow] Failed to open window - popup blocked?');
      return null;
    }
    
    return previewWindow;
  } catch (err) {
    console.error('[PreviewWindow] Error opening preview:', err);
    return null;
  }
}

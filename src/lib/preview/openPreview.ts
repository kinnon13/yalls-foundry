import { generatePreviewToken } from '@/lib/security/hmac';

/**
 * Open preview window with HMAC token for secure postMessage
 * Parent uses this to launch previews
 */
export async function openPreviewWindow(path: string): Promise<Window | null> {
  const parentOrigin = window.location.origin;
  
  // Generate HMAC token
  const token = await generatePreviewToken(parentOrigin);
  
  // Build URL with token params
  const url = new URL(path, parentOrigin);
  url.searchParams.set('parent', parentOrigin);
  url.searchParams.set('tk', token.tk);
  url.searchParams.set('exp', token.exp.toString());
  
  // Open in new window
  const windowFeatures = 'width=480,height=720,resizable=yes,scrollbars=yes';
  const previewWindow = window.open(url.toString(), 'preview', windowFeatures);
  
  if (!previewWindow) {
    console.error('[PreviewWindow] Failed to open window - popup blocked?');
    return null;
  }
  
  return previewWindow;
}

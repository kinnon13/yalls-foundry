/**
 * Rocker Integration: Media Uploads
 * 
 * Connects upload operations to Rocker for AI analysis and tagging.
 */

import { logRockerEvent } from '../bus';
import { supabase } from '@/integrations/supabase/client';

export async function rockerMediaUploaded(params: {
  userId: string;
  mediaId: string;
  fileType: string;
  fileName: string;
  linkedEntities?: Array<{ id: string; type: string }>;
  sessionId?: string;
}): Promise<void> {
  await logRockerEvent('user.upload.media', params.userId, {
    mediaId: params.mediaId,
    fileType: params.fileType,
    fileName: params.fileName,
    linkedEntities: params.linkedEntities,
  }, params.sessionId);

  // Trigger AI analysis
  try {
    await supabase.functions.invoke('generate-preview', {
      body: {
        mediaId: params.mediaId,
        userId: params.userId,
      },
    });
  } catch (err) {
    console.error('[Rocker] Failed to trigger media analysis:', err);
  }

  // Rocker should:
  // - Analyze image content
  // - Suggest tags
  // - Identify horses/people
  // - Verify accuracy
}

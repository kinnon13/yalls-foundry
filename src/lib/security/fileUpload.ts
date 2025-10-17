/**
 * Secure File Upload Utilities
 * 
 * CRITICAL: Always validate files before uploading to prevent:
 * - XSS attacks via SVG/HTML files
 * - Storage exhaustion via large files
 * - Malware uploads
 */

import { supabase } from '@/integrations/supabase/client';
import { validateFile, type FileValidationResult } from './sanitize';

export interface UploadOptions {
  bucket: string;
  path: string;
  maxSizeBytes?: number;
  allowSvg?: boolean;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

/**
 * Secure file upload with validation
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file, {
    maxSizeBytes: options.maxSizeBytes,
    allowSvg: options.allowSvg,
    allowedTypes: options.allowedTypes,
  });
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }
  
  try {
    // Generate safe filename (strip path separators)
    const safeFilename = file.name.replace(/[/\\]/g, '_');
    const filePath = `${options.path}/${Date.now()}-${safeFilename}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(data.path);
    
    return {
      success: true,
      publicUrl: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload multiple files securely
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions
): Promise<UploadResult[]> {
  return Promise.all(
    files.map(file => uploadFile(file, options))
  );
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Get signed URL for private files
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) throw error;
    
    return { url: data.signedUrl };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get signed URL',
    };
  }
}

/**
 * Validate image dimensions (optional check)
 */
export async function validateImageDimensions(
  file: File,
  maxWidth = 4096,
  maxHeight = 4096
): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          valid: false,
          error: `Image too large. Max: ${maxWidth}x${maxHeight}px`,
        });
      } else {
        resolve({ valid: true });
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Invalid image file',
      });
    };
    
    img.src = url;
  });
}

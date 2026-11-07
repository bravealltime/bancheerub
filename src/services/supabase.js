import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rvrgpwzxsqjmilnmispj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o-Hc8Ln7dlWRqc_yK1w4VA_kKAcDhxf';
export const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'homespace';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload base64 receipt image to Supabase Storage Bucket
 * @param {string} base64Data
 * @param {string} prefix
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export async function uploadReceiptPhotoToSupabase(base64Data, prefix = 'receipt') {
  if (!base64Data || !base64Data.startsWith('data:image')) {
    return base64Data;
  }

  try {
    const match = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) return base64Data;

    const mimeType = match[1];
    const byteCharacters = atob(match[2]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `receipts/${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filename, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error, falling back to local base64:', error.message);
      return base64Data;
    }

    const { data: publicData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filename);

    return publicData.publicUrl;
  } catch (err) {
    console.warn('[Supabase Storage] Exception uploading receipt:', err);
    return base64Data;
  }
}

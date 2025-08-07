// uploadImg.js
import { NotificationBox } from '../components/notification.js';
import { supabase } from './supabaseInit_2.js';

export const GeotaggedFileService = {
  async upload(file) {
    if (!file || !(file instanceof File)) {
      NotificationBox.show("No valid file selected.");
      return null;
    }

    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      // Clean up filename: remove or replace unsafe characters
      const timestamp = Date.now();
      const sanitizedFileName = `${timestamp}_${file.name.replace(/[^\w\-\.() ]+/g, '').replace(/\s+/g, '_')}`;

      const { data, error } = await supabase
        .storage
        .from('geotagged')
        .upload(sanitizedFileName, compressedFile);

      if (error) {
        console.error("Upload failed:", error.message);
        NotificationBox.show("Upload failed: " + error.message);
        return null;
      }

      // No need to encode path here — Supabase handles it for the URL
      const publicURL = supabase
        .storage
        .from('geotagged')
        .getPublicUrl(data.path).data.publicUrl;
      return publicURL;
    } catch (err) {
      console.error("Compression error:", err.message);
      NotificationBox.show("Compression failed: " + err.message);
      return null;
    }
  },

  async delete(publicUrl) {
    if (!publicUrl) {
      console.warn("No URL provided for deletion.");
      return;
    }

    try {
      const decodedUrl = decodeURIComponent(publicUrl);
      const match = decodedUrl.match(/\/geotagged\/(.+)$/);

      if (!match || !match[1]) {
        console.error("Invalid geotagged URL format.");
        return;
      }

      const filePath = match[1].replace(/^\/+/, ''); // Remove any leading slashes

      const { error } = await supabase.storage.from('geotagged').remove([filePath]);

      if (error) {
        console.error("Delete failed:", error.message);
        NotificationBox.show("Failed to delete old image.");
      } else {

      }
    } catch (err) {
      console.error("Error parsing URL for deletion:", err.message);
      NotificationBox.show("Failed to process deletion.");
    }
  }
};

export async function uploadSignatureToSupabase(base64Data, fileName) {
  const blob = await (await fetch(base64Data)).blob();

  const { data, error } = await supabase.storage
    .from('signature')
    .upload(fileName, blob, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) throw error;

  // Get public URL
  const { data: publicURLData } = supabase.storage.from('signature').getPublicUrl(fileName);
  return publicURLData.publicUrl;
}

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
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase
        .storage
        .from('geotagged')
        .upload(fileName, compressedFile);

      if (error) {
        console.error("Upload failed:", error.message);
        NotificationBox.show("Upload failed: " + error.message);
        return null;
      }

      const publicURL = supabase
        .storage
        .from('geotagged')
        .getPublicUrl(data.path).data.publicUrl;

      console.log("Upload succeeded:", publicURL);
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
      // Match and extract everything after 'geotagged/' (including subfolders or filenames)
      const match = publicUrl.match(/geotagged\/+(.+)/);
      if (!match || !match[1]) {
        console.error("Invalid geotagged URL format.");
        //NotificationBox.show("Invalid image URL.");
        return;
      }

      const filePath = match[1]; // Extracted path like "1752222804244_1.png"
      
      const { error } = await supabase
        .storage
        .from('geotagged')
        .remove([filePath]);

      if (error) {
        console.error("Delete failed:", error.message);
        NotificationBox.show("Failed to delete old image.");
      } else {
        console.log("Old image deleted:", filePath);
      }
    } catch (err) {
      console.error("Error parsing URL for deletion:", err.message);
      NotificationBox.show("Failed to process deletion.");
    }
  }

};

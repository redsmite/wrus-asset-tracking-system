import { supabase } from './supabaseInit.js';

export const FileService = {
  async uploadICSFile(file) {
    const fileName = Date.now() + '_' + file.name;

    const { data, error } = await supabase
      .storage
      .from('ics-files')
      .upload(fileName, file);

    if (error) {
      console.error('ICS file upload failed:', error.message);
      alert('ICS file upload failed.');
      return null;
    }

    const publicURL = supabase
      .storage
      .from('ics-files')
      .getPublicUrl(data.path).data.publicUrl;

    return publicURL;
  },

  async uploadPermitFile(file) {
    const fileName = Date.now() + '_' + file.name;

    const { data, error } = await supabase
      .storage
      .from('permit')
      .upload(fileName, file);

    if (error) {
      console.error('Permit file upload failed:', error.message);
      alert('Permit file upload failed.');
      return null;
    }

    const publicURL = supabase
      .storage
      .from('permit')
      .getPublicUrl(data.path).data.publicUrl;

    return publicURL;
  },

  async deleteFileFromStorage(url, bucket = 'ics-files') {
      if (!url) return true;

      try {
        const decodedUrl = decodeURIComponent(url);
        const publicPrefix = `/storage/v1/object/public/${bucket}/`;
        const pathIndex = decodedUrl.indexOf(publicPrefix);

        if (pathIndex === -1) {
          console.warn(`⚠️ Couldn't find base path in URL for bucket ${bucket}`);
          return false;
        }

        let relativePath = decodedUrl.substring(pathIndex + publicPrefix.length);
        relativePath = relativePath.replace(/^\/+/, '').trim();

        const { error } = await supabase.storage
          .from(bucket)
          .remove([relativePath]);

        if (error) {
          console.error(`❌ Delete error from ${bucket}:`, error.message);
          return false;
        }

        return true;

      } catch (err) {
        console.error('❌ Error during deleteFileFromStorage:', err);
        return false;
      }
    },

async deleteFileFromPermitBucket(url, bucket = 'permit') {
  console.log(url);
  if (!url) return true;

  try {
    const decodedUrl = decodeURIComponent(url);
    const publicPrefix = `/storage/v1/object/public/${bucket}/`;
    const pathIndex = decodedUrl.indexOf(publicPrefix);

    if (pathIndex === -1) {
      console.warn(`⚠️ Couldn't find base path in URL for bucket '${bucket}'`);
      return false;
    }

    let relativePath = decodedUrl.substring(pathIndex + publicPrefix.length);
    relativePath = relativePath.replace(/^\/+/, '').trim();

    console.log(`🗑️ Deleting file from ${bucket} bucket: ${relativePath}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([relativePath]);

    if (error) {
      console.error(`❌ Delete error from '${bucket}':`, error.message);
      return false;
    }

    console.log('✅ File deleted successfully.');
    return true;

  } catch (err) {
    console.error('❌ Error in deleteFileFromPermitBucket:', err);
    return false;
  }
}
};

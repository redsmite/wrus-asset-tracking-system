import { supabase } from './supabaseInit.js';

// const { error } = await supabase.storage
//   .from('ics-files')
//   .remove(['1750321196481_ITR 2025-05-0007.pdf']);

// if (error) {
//   console.error("❌ Delete error:", error.message);
// } else {
//   console.log("✅ Delete succeeded");
// }

export async function deleteFileFromStorage(url) {
  if (!url) return true;

  try {
    console.log("🔥 Full URL:", url);

    const decodedUrl = decodeURIComponent(url);
    console.log("🧪 Decoded:", decodedUrl);

    const publicPrefix = '/storage/v1/object/public/ics-files/';
    const pathIndex = decodedUrl.indexOf(publicPrefix);

    if (pathIndex === -1) {
      console.warn("⚠️ Couldn't find base path in URL");
      return false;
    }

    // ✅ Extract relative path and clean it
    let relativePath = decodedUrl.substring(pathIndex + publicPrefix.length);
    relativePath = relativePath.replace(/^\/+/, '').trim(); // remove leading slashes, extra spaces

    console.log("📎 Final path:", relativePath);

    // ✅ Deletion using confirmed working method
    const { error } = await supabase.storage
      .from('ics-files')
      .remove([relativePath]);

    if (error) {
      console.error("❌ Delete error:", error.message);
      return false;
    }

    console.log("✅ Delete succeeded");
    return true;

  } catch (err) {
    console.error("❌ Error during deleteFileFromStorage:", err);
    return false;
  }
}

export async function uploadFileAndGetURL(file) {
  const fileName = Date.now() + '_' + file.name;

  const { data, error } = await supabase
    .storage
    .from('ics-files')
    .upload(fileName, file);

    console.log('🆙 Uploaded path:', data?.path);

  if (error) {
    console.error('Upload failed:', error.message);
    alert('File upload failed.');
    return null;
  }

  const publicURL = supabase
    .storage
    .from('ics-files')
    .getPublicUrl(data.path).data.publicUrl;

  return publicURL;
}
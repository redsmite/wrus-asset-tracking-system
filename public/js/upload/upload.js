import { supabase } from './supabaseInit.js';

// async function uploadFile(file) {
//   const fileName = Date.now() + '_' + file.name;

//   const { data, error } = await supabase
//     .storage
//     .from('ics-files')
//     .upload(fileName, file);

//   if (error) {
//     console.error('Upload failed:', error.message);
//     return;
//   }

//   const publicURL = supabase
//     .storage
//     .from('ics-files')
//     .getPublicUrl(data.path).data.publicUrl;

//   console.log('Public URL:', publicURL);
//   await storeFilePathInFirestore(publicURL);
// }

// document.getElementById("uploadButton").addEventListener("click", async () => {
//   const file = document.getElementById("uploadInput").files[0];
//   if (file) {
//     await uploadFile(file);
//   } else {
//     alert("Please select a file first.");
//   }
// });

export async function uploadFileAndGetURL(file) {
  const fileName = Date.now() + '_' + file.name;

  const { data, error } = await supabase
    .storage
    .from('ics-files')
    .upload(fileName, file);

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

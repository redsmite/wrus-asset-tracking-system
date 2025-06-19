import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { db } from "../firebaseConfig.js";

export async function storeFilePathInFirestore(fileUrl) {
  const id = Math.random().toString(36).substring(2, 10);
  const docRef = doc(db, 'ICS', id);

  await setDoc(docRef, {
    fileUrl,
    uploadedAt: new Date()
  });

  console.log('Stored in Firestore:', fileUrl);
}
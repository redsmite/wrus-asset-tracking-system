import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

// Fetch all users
export async function getUsers() {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(q);
  const users = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      id: doc.id,
      ...data,
    });
  });

  return users;
}

export async function getUsersMap() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  const usersMap = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    usersMap[doc.id] = `${data.lastName}, ${data.firstName} ${data.middleInitial || ''}.`;
  });

  return usersMap;
}

// Fetch all ICS entries
export async function getICSListWithDocIds() {
  const icsRef = collection(db, "ICS");
  const q = query(icsRef, orderBy("timestamp", "desc")); // ✅ Order by timestamp descending
  const snapshot = await getDocs(q);

  const result = [];

  snapshot.forEach(docSnap => {
    result.push({
      id: docSnap.id,
      data: docSnap.data()
    });
  });

  return result;
}

// Add ICS entry
export async function addICSEntry(icsData) {
  try {
    if (!icsData.ICSno || typeof icsData.ICSno !== 'string' || icsData.ICSno.trim() === '') {
      alert('ICS No. is required.');
      return;
    }

    const dataToSave = {
      ...icsData,
      timestamp: serverTimestamp(), // 🔹 Add server-generated timestamp
    };

    await addDoc(collection(db, 'ICS'), dataToSave);
    alert('ICS entry saved successfully!');
  } catch (err) {
    console.error("Error adding ICS entry:", err);
    alert('Error saving ICS entry. Check console for details.');
  }
}

export async function updateICSEntry(docId, updatedData) {
  const docRef = doc(db, "ICS", docId);
  await updateDoc(docRef, updatedData);
}
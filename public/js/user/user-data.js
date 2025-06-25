import { db } from "../firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export async function addUser(userData) {
  const usersRef = collection(db, 'users');
  await addDoc(usersRef, {
    ...userData,
    timestamp: serverTimestamp()
  });
}

export async function fetchUsers() {
  const usersCol = collection(db, "users");
  const usersQuery = query(usersCol, orderBy("timestamp", "desc"));
  const userSnapshot = await getDocs(usersQuery);
  return userSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function updateUser(id, updatedData) {
  const userRef = doc(db, "users", id);
  try {
    await updateDoc(userRef, updatedData);
    console.log(`User with ID ${id} successfully updated.`);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
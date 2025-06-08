import { db } from "../firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

/**
 * Add user to Firestore collection 'users'
 * @param {Object} userData - User data object with required fields
 */
export async function addUser(userData) {
  const usersRef = collection(db, 'users');
  await addDoc(usersRef, userData);
}

export async function fetchUsers() {
  const usersCol = collection(db, "users"); // Use your actual collection name
  const userSnapshot = await getDocs(usersCol);
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
import { db } from "../firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export const Users = {
  collectionRef: collection(db, "users"),

  async add(userData) {
    await addDoc(this.collectionRef, {
      ...userData,
      timestamp: serverTimestamp()
    });
  },

  async fetchAllDesc() {
    const usersQuery = query(
      this.collectionRef,
      orderBy("timestamp", "desc")
    );
    const userSnapshot = await getDocs(usersQuery);
    return userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async fetchAllAsc() {
    const usersQuery = query(
      this.collectionRef,
      orderBy("timestamp", "asc")
    );
    const userSnapshot = await getDocs(usersQuery);
    return userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async update(id, updatedData) {
    const userRef = doc(db, "users", id);
    try {
      await updateDoc(userRef, updatedData);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },
};


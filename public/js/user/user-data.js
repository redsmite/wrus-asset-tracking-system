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
  async getUsersMap() {
    const snapshot = await getDocs(this.collectionRef);
    const usersMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      usersMap[doc.id] = `${data.lastName}, ${data.firstName} ${data.middleInitial || ''}.`.trim();
    });

    return usersMap;
  },
  async fetchUsersSummary() {
    const q = query(collection(db, "users"), orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    const users = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Skip if role is admin
      if (doc.id.toLowerCase() === "admin") return;

      users.push({
        id: doc.id,
        username: data.username || '',
        lastName: data.lastName || '',
        firstName: data.firstName || '',
        middleInitial: data.middleInitial || '',
        type: data.type || '',
        status: data.status || ''
      });
    });

    return users;
  }
};


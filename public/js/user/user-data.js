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
  localStorageKey: "cachedUsers",

  async add(userData) {
    await addDoc(this.collectionRef, {
      ...userData,
      timestamp: serverTimestamp()
    });
    localStorage.removeItem(this.localStorageKey); // Invalidate cache
  },

  async fetchAllDesc() {
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) {
      const data = JSON.parse(cached);
      return data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
    }

    const usersQuery = query(this.collectionRef, orderBy("timestamp", "desc"));
    const userSnapshot = await getDocs(usersQuery);
    const users = userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    localStorage.setItem(this.localStorageKey, JSON.stringify(users));
    return users;
  },

  async fetchAllAsc() {
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) {
      const data = JSON.parse(cached);
      return data.sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
    }

    const usersQuery = query(this.collectionRef, orderBy("timestamp", "asc"));
    const userSnapshot = await getDocs(usersQuery);
    const users = userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    localStorage.setItem(this.localStorageKey, JSON.stringify(users));
    return users;
  },

  async update(id, updatedData) {
    const userRef = doc(db, "users", id);
    try {
      await updateDoc(userRef, updatedData);
      localStorage.removeItem(this.localStorageKey); // Invalidate cache
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  async getUsersMap() {
    const cached = localStorage.getItem(this.localStorageKey);
    const users = cached ? JSON.parse(cached) : await this.fetchAllAsc();

    const usersMap = {};
    users.forEach(user => {
      usersMap[user.id] = `${user.lastName}, ${user.firstName} ${user.middleInitial || ''}.`.trim();
    });

    return usersMap;
  },

  async fetchUsersSummary() {
    const cached = localStorage.getItem(this.localStorageKey);
    const users = cached ? JSON.parse(cached) : await this.fetchAllAsc();

    return users
      .filter(user => user.id.toLowerCase() !== "admin")
      .map(user => ({
        id: user.id,
        username: user.username || '',
        lastName: user.lastName || '',
        firstName: user.firstName || '',
        middleInitial: user.middleInitial || '',
        type: user.type || '',
        status: user.status || ''
      }));
  },

  async refreshCache() {
    const usersQuery = query(this.collectionRef, orderBy("timestamp", "desc"));
    const userSnapshot = await getDocs(usersQuery);
    const users = userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    localStorage.setItem(this.localStorageKey, JSON.stringify(users));
    return users;
  }
};

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
    const docRef = await addDoc(this.collectionRef, {
      ...userData,
      timestamp: serverTimestamp()
    });

    const newUserDoc = await getDoc(docRef);
    const newUser = { id: newUserDoc.id, ...newUserDoc.data() };

    // Append to cached data
    const cached = localStorage.getItem(this.localStorageKey);
    const users = cached ? JSON.parse(cached) : [];
    users.push(newUser);
    localStorage.setItem(this.localStorageKey, JSON.stringify(users));
  },

  async update(id, updatedData) {
    const userRef = doc(db, "users", id);
    try {
      await updateDoc(userRef, updatedData);

      // Update cache in-place
      const cached = localStorage.getItem(this.localStorageKey);
      if (cached) {
        const users = JSON.parse(cached);
        const index = users.findIndex(user => user.id === id);
        if (index !== -1) {
          users[index] = { ...users[index], ...updatedData };
          localStorage.setItem(this.localStorageKey, JSON.stringify(users));
        }
      }
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
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
  },

  async autoRefreshDaily() {
    const now = Date.now();
    const lastFetch = parseInt(localStorage.getItem("lastUsersFetch") || "0");
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (now - lastFetch > oneDayMs) {
      await this.refreshCache();
      localStorage.setItem("lastUsersFetch", now.toString());
      console.log("User cache refreshed automatically (daily).");
    } else {
      console.log("User cache still fresh. No need to auto-refresh.");
    }
  },

  async autoRefreshEvery8Hours() {
    const key = 'cachedUser_lastRefresh';
    const now = Date.now();
    const last = localStorage.getItem(key);

    if (!last || now - parseInt(last, 10) > 8 * 60 * 60 * 1000) {
      await this.refreshCache();
      localStorage.setItem(key, now.toString());
      console.log("[User] Cache refreshed (8-hour interval).");
    }
  }
};


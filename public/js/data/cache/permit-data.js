import { db } from '../../firebaseConfig.js';
import {
  collection,
  query,
  where,
  getDoc,
  getDocs,
  orderBy,
  limit,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Reference the collection in Firestore
const permitCollection = collection(db, 'permits');

export const Permit = {
  localStorageKey: "cachedPermits",

  // 🔸 Add a new permit
  async add(data) {
    try {
      const permitNoToCheck = data.permitNo.trim();

      const duplicateQuery = query(
        permitCollection,
        where('permitNo', '==', permitNoToCheck)
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        throw new Error(`Permit No "${permitNoToCheck}" already exists.`);
      }

      const latestQuery = query(
        permitCollection,
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const latestSnapshot = await getDocs(latestQuery);

      let newIdNumber = '0001';
      if (!latestSnapshot.empty) {
        const lastDoc = latestSnapshot.docs[0];
        const lastId = lastDoc.id;
        const lastNumber = parseInt(lastId.split('-')[1]);
        const nextNumber = lastNumber + 1;
        newIdNumber = nextNumber.toString().padStart(4, '0');
      }

      const newDocId = `2025-${newIdNumber}`;
      const docRef = doc(db, 'permits', newDocId);

      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
      });

      // ✅ Re-fetch saved document to get server timestamp and all accurate fields
      const savedDoc = await getDoc(docRef);
      if (!savedDoc.exists()) {
        throw new Error("Failed to fetch the newly added permit");
      }

      const savedData = { id: savedDoc.id, ...savedDoc.data() };

      // ✅ Update cache
      const cached = localStorage.getItem(this.localStorageKey);
      const parsed = cached ? JSON.parse(cached) : [];

      // Remove any existing entry with same ID to avoid duplicates
      const updatedCache = parsed.filter(item => item.id !== savedData.id);

      // Add new item at the beginning for descending order
      updatedCache.unshift(savedData);

      // Save updated cache
      localStorage.setItem(this.localStorageKey, JSON.stringify(updatedCache));

    } catch (error) {
      console.error('Error adding permit:', error.message);
      throw error;
    }
  },


  // 🔸 Get all permits (from localStorage first)
  async getAll() {
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    try {
      const querySnapshot = await getDocs(
        query(permitCollection, orderBy('createdAt', 'desc'))
      );
      const permits = [];
      querySnapshot.forEach((doc) => {
        permits.push({ id: doc.id, ...doc.data() });
      });

      localStorage.setItem(this.localStorageKey, JSON.stringify(permits));
      return permits;
    } catch (error) {
      console.error('Error fetching permits:', error.message);
      throw error;
    }
  },

  // 🔸 Force refresh cache
  async refreshCache() {
    try {
      const querySnapshot = await getDocs(
        query(permitCollection, orderBy('createdAt', 'desc'))
      );
      const permits = [];
      querySnapshot.forEach((doc) => {
        permits.push({ id: doc.id, ...doc.data() });
      });

      localStorage.setItem(this.localStorageKey, JSON.stringify(permits));
      return permits;
    } catch (error) {
      console.error("Error refreshing permit cache:", error.message);
      throw error;
    }
  },

  // 🔸 Update a permit
  async update(id, data) {
    try {
      const docRef = doc(permitCollection, id);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // ✅ Update cache
      const cached = localStorage.getItem(this.localStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const updated = parsed.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date() } : p);
        localStorage.setItem(this.localStorageKey, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error updating permit:', error.message);
      throw error;
    }
  },

  // 🔸 Delete a permit
  async delete(id) {
    try {
      await deleteDoc(doc(permitCollection, id));

      // ✅ Remove from cache
      const cached = localStorage.getItem(this.localStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const filtered = parsed.filter(p => p.id !== id);
        localStorage.setItem(this.localStorageKey, JSON.stringify(filtered));
      }

      console.log(`🗑️ Permit ${id} deleted successfully`);
    } catch (error) {
      throw error;
    }
  },

  async autoRefreshDaily() {
    const key = this.localStorageKey;
    const dateKey = `${key}_lastRefreshDate`;
    const today = new Date().toISOString().split("T")[0];

    const lastRefresh = localStorage.getItem(dateKey);

    if (lastRefresh !== today) {
      await this.refreshCache();
      localStorage.setItem(dateKey, today);
      console.log("[Permit] Cache auto-refreshed for the day.");
    }
  },

  async autoRefreshEvery8Hours() {
    const key = 'cachedPermit_lastRefresh';
    const now = Date.now();
    const last = localStorage.getItem(key);

    if (!last || now - parseInt(last, 10) > 8 * 60 * 60 * 1000) {
      await this.refreshCache();
      localStorage.setItem(key, now.toString());
      console.log("[Permit] Cache refreshed (8-hour interval).");
    }
  },
  async getById(id) {
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const found = parsed.find(p => p.id === id);
      if (found) return found;
    }

    try {
      const docRef = doc(permitCollection, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() };
        
        const parsed = cached ? JSON.parse(cached) : [];
        parsed.push(data);
        localStorage.setItem(this.localStorageKey, JSON.stringify(parsed));

        return data;
      } else {
        throw new Error(`Permit with ID "${id}" not found.`);
      }
    } catch (error) {
      console.error('Error in getById:', error.message);
      throw error;
    }
  }
};

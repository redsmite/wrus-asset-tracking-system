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

const permitCollection = collection(db, 'permits');

export const Permit = {
  localStorageKey: "cachedPermits",

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

      const docRef = doc(permitCollection);

      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
      });

      const savedDoc = await getDoc(docRef);
      if (!savedDoc.exists()) {
        throw new Error("Failed to fetch the newly added permit");
      }

      const savedData = { id: savedDoc.id, ...savedDoc.data() };

      const cached = localStorage.getItem(this.localStorageKey);
      const parsed = cached ? JSON.parse(cached) : [];

      const updatedCache = parsed.filter(item => item.id !== savedData.id);

      updatedCache.unshift(savedData);

      updatedCache.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });

      localStorage.setItem(this.localStorageKey, JSON.stringify(updatedCache));

    } catch (error) {
      console.error('Error adding permit:', error.message);
      throw error;
    }
  },

  async getAll(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = localStorage.getItem(this.localStorageKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.warn('Cache corrupted, falling back to Firestore');
        }
      }
    }
    try {
      const snapshot = await getDocs(permitCollection);
      let permits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      permits.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });

      localStorage.setItem(this.localStorageKey, JSON.stringify(permits));

      return permits;
    } catch (error) {
      console.error('Error fetching permits from Firestore:', error.message);
      throw error;
    }
  },

  async refreshCache() {
    try {
      const snapshot = await getDocs(permitCollection);
      let permits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      permits.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });

      localStorage.setItem(this.localStorageKey, JSON.stringify(permits));

      console.log(' Local cache refreshed successfully');
    } catch (error) {
      console.error('Error refreshing cache:', error.message);
      throw error;
    }
  },

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

  async delete(id) {
    try {
      await deleteDoc(doc(permitCollection, id));

      const cached = localStorage.getItem(this.localStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const filtered = parsed.filter(p => p.id !== id);
        localStorage.setItem(this.localStorageKey, JSON.stringify(filtered));
      }

      console.log(`Permit ${id} deleted successfully`);
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

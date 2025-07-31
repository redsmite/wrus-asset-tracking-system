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

      // 🔍 Check for duplicate permitNo
      const duplicateQuery = query(
        permitCollection,
        where('permitNo', '==', permitNoToCheck)
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        throw new Error(`Permit No "${permitNoToCheck}" already exists.`);
      }

      // ✅ Use Firestore to create a new doc with a random ID
      const docRef = doc(permitCollection);  // <-- this creates a ref with a random ID

      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
      });

      // ✅ Fetch saved document to get Firestore timestamp
      const savedDoc = await getDoc(docRef);
      if (!savedDoc.exists()) {
        throw new Error("Failed to fetch the newly added permit");
      }

      const savedData = { id: savedDoc.id, ...savedDoc.data() };

      // ✅ Update local cache
      const cached = localStorage.getItem(this.localStorageKey);
      const parsed = cached ? JSON.parse(cached) : [];

      // Remove any duplicate ID before adding the new one
      const updatedCache = parsed.filter(item => item.id !== savedData.id);

      // Add new permit at the beginning for descending order
      updatedCache.unshift(savedData);

      // Sort by Firestore timestamp
      updatedCache.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });

      // Save updated cache
      localStorage.setItem(this.localStorageKey, JSON.stringify(updatedCache));

    } catch (error) {
      console.error('Error adding permit:', error.message);
      throw error;
    }
  },

  // 🔸 Get all permits (from localStorage first)
  async getAll() {
    try {
      const snapshot = await getDocs(permitCollection);
      let permits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ Sort safely (handles Firestore timestamps & plain dates)
      permits.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate; // newest first
      });

      // ✅ Update cache
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
      const snapshot = await getDocs(permitCollection);
      let permits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ Safe sorting
      permits.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });

      // ✅ Save back to cache
      localStorage.setItem(this.localStorageKey, JSON.stringify(permits));

      console.log('✅ Local cache refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing cache:', error.message);
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

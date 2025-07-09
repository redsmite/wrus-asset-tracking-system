import { db } from '../firebaseConfig.js';
import {
  collection,
  query,
  where,
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

      // 🔢 Generate new custom document ID
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
      const newData = {
        ...data,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'permits', newDocId), newData);
      localStorage.removeItem(this.localStorageKey); // ❌ Invalidate cache
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
      return parsed.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
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

      localStorage.removeItem(this.localStorageKey); // ❌ Invalidate cache
    } catch (error) {
      console.error('Error updating permit:', error.message);
      throw error;
    }
  },

  // 🔸 Delete a permit
  async delete(id) {
    try {
      await deleteDoc(doc(permitCollection, id));
      localStorage.removeItem(this.localStorageKey); // ❌ Invalidate cache
      console.log(`🗑️ Permit ${id} deleted successfully`);
    } catch (error) {
      throw error;
    }
  },
  
  async autoRefreshDaily() {
    const key = this.localStorageKey;
    const dateKey = `${key}_lastRefreshDate`;
    const today = new Date().toISOString().split("T")[0]; // Format: '2025-07-08'

    const lastRefresh = localStorage.getItem(dateKey);

    if (lastRefresh !== today) {
      await this.refreshCache();
      localStorage.setItem(dateKey, today);
      console.log("[Permit] Cache auto-refreshed for the day.");
    }
  }
};
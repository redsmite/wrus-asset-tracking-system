import { db } from '../firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, setDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const WUSCollection = collection(db, 'water_users');

const CACHE_KEY = 'cachedWUS';
const CACHE_KEY_ASC = 'cachedWUSAsc';
const CACHE_KEY_DESC = 'cachedWUSDesc';

export const WUSData = {
  async fetchAll() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const snapshot = await getDocs(WUSCollection);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  },

  async fetchAllAsc() {
    const cached = localStorage.getItem(CACHE_KEY_ASC);
    if (cached) {
      return JSON.parse(cached);
    }

    const q = query(WUSCollection, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    localStorage.setItem(CACHE_KEY_ASC, JSON.stringify(data));
    return data;
  },

  async fetchAllDesc() {
    const cached = localStorage.getItem(CACHE_KEY_DESC);
    if (cached) {
      return JSON.parse(cached);
    }

    const q = query(WUSCollection, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    localStorage.setItem(CACHE_KEY_DESC, JSON.stringify(data));
    return data;
  },

  async refreshCache() {
    const snapshot = await getDocs(WUSCollection);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_KEY_ASC, JSON.stringify([...data].sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds)));
    localStorage.setItem(CACHE_KEY_DESC, JSON.stringify([...data].sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)));

    return data;
  },

  async add(data) {
    const newData = {
      ...data,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(WUSCollection, newData); // Use Firestore auto-generated ID
    const newId = docRef.id;

    // ✅ Update localStorage cache
    const entry = { id: newId, ...data, timestamp: { seconds: Date.now() / 1000 } };

    const updateCache = (key, sortFn) => {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [...existing, entry].sort(sortFn);
      localStorage.setItem(key, JSON.stringify(updated));
    };

    updateCache(CACHE_KEY, () => 0);
    updateCache(CACHE_KEY_ASC, (a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
    updateCache(CACHE_KEY_DESC, (a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

    return { id: newId, ...newData };
  },


  async update(id, data) {
    const docRef = doc(db, 'water_users', id);
    await updateDoc(docRef, { ...data });

    const updateCache = (key) => {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.map(entry => {
        return entry.id === id ? { ...entry, ...data } : entry;
      });
      localStorage.setItem(key, JSON.stringify(updated));
    };

    updateCache(CACHE_KEY);
    updateCache(CACHE_KEY_ASC);
    updateCache(CACHE_KEY_DESC);
  },

  async delete(id) {
    const docRef = doc(db, 'water_users', id);
    await deleteDoc(docRef);

    const updateCache = (key) => {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.filter(entry => entry.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
    };

    updateCache(CACHE_KEY);
    updateCache(CACHE_KEY_ASC);
    updateCache(CACHE_KEY_DESC);
  },

  async autoRefreshDaily() {
    const dateKey = 'cachedWUS_lastRefreshDate';
    const today = new Date().toISOString().split("T")[0]; // e.g., "2025-07-08"

    const lastRefresh = localStorage.getItem(dateKey);
    if (lastRefresh !== today) {
      await this.refreshCache();
      localStorage.setItem(dateKey, today);
      console.log("[WUS] Cache auto-refreshed for the day.");
    }
  },
    async autoRefreshEvery8Hours() {
    const key = 'cachedWUS_lastRefresh';
    const now = Date.now();
    const last = localStorage.getItem(key);

    if (!last || now - parseInt(last, 10) > 8 * 60 * 60 * 1000) {
      await this.refreshCache();
      localStorage.setItem(key, now.toString());
      console.log("[WUS] Cache refreshed (8-hour interval).");
    }
  }
};

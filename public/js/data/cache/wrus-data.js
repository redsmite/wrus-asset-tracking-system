import { db } from '../../firebaseConfig.js';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const WUSCollection = collection(db, 'water_users');
const CACHE_KEY = 'cachedWUS';

export const WUSData = {
  async fetchAll() {
    const cached = localStorage.getItem(CACHE_KEY);
    const data = cached ? JSON.parse(cached) : await this.refreshCache();

    return [...data].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  },

  async refreshCache() {
    const snapshot = await getDocs(WUSCollection);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  },

  async add(data) {
    const newData = {
      ...data,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(WUSCollection, newData);
    const newId = docRef.id;

    const entry = {
      id: newId,
      ...data,
      timestamp: { seconds: Date.now() / 1000 } // fallback for now
    };

    const existing = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    existing.push(entry);
    localStorage.setItem(CACHE_KEY, JSON.stringify(existing));

    return { id: newId, ...newData };
  },

  async update(id, data) {
    const docRef = doc(db, 'water_users', id);
    await updateDoc(docRef, { ...data });

    const existing = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const updated = existing.map(entry =>
      entry.id === id ? { ...entry, ...data } : entry
    );
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  },

  async delete(id) {
    const docRef = doc(db, 'water_users', id);
    await deleteDoc(docRef);

    const existing = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const updated = existing.filter(entry => entry.id !== id);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  },

  async autoRefreshDaily() {
    const dateKey = 'cachedWUS_lastRefreshDate';
    const today = new Date().toISOString().split("T")[0];

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

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
    const q = query(WUSCollection, orderBy('__name__', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    let newNumber = 1;
    if (!snapshot.empty) {
      const lastId = snapshot.docs[0].id;
      const match = lastId.match(/2025-(\d{4})/);
      const lastNumber = match ? parseInt(match[1]) : 0;
      newNumber = lastNumber + 1;
    }

    const formattedNumber = String(newNumber).padStart(4, '0');
    const newId = `2025-${formattedNumber}`;

    const newData = {
      ...data,
      timestamp: serverTimestamp()
    };

    const docRef = doc(db, 'water_users', newId);
    await setDoc(docRef, newData);

    // ❌ Invalidate all cache
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_KEY_ASC);
    localStorage.removeItem(CACHE_KEY_DESC);

    return { id: newId, ...newData };
  },

  async update(id, data) {
    const docRef = doc(db, 'water_users', id);
    await updateDoc(docRef, { ...data });

    // ❌ Invalidate cache
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_KEY_ASC);
    localStorage.removeItem(CACHE_KEY_DESC);
  },

  async delete(id) {
    const docRef = doc(db, 'water_users', id);
    await deleteDoc(docRef);

    // ❌ Invalidate cache
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_KEY_ASC);
    localStorage.removeItem(CACHE_KEY_DESC);
  }
};

import { db } from '../firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const WUSCollection = collection(db, 'water_users');

export const WUSData = {
  async fetchAll() {
    const snapshot = await getDocs(WUSCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
    // **Ascending** on timestamp
  async fetchAllAsc() {
    const q = query(WUSCollection, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // **Descending** on timestamp
  async fetchAllDesc() {
    const q = query(WUSCollection, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async add(data) {
    const newData = {
      ...data,
      timestamp: serverTimestamp()
    };
    return await addDoc(WUSCollection, newData);
  },

  async update(id, data) {
    const docRef = doc(db, 'water_users', id);
    return await updateDoc(docRef, {
      ...data
    });
  },

  async delete(id) {
    const docRef = doc(db, 'water_users', id);
    return await deleteDoc(docRef);
  }
};
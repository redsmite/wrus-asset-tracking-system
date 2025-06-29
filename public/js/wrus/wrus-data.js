import { db } from '../firebaseConfig.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, setDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
    console.log('Adding new user:', newId, newData);

    await setDoc(docRef, newData);

    return { id: newId, ...newData };
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
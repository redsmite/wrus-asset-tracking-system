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
  async add(data) {
    try {
      const permitNoToCheck = data.permitNo.trim();

      // 🔍 Check for duplicate permitNo (case-sensitive)
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
    } catch (error) {
      console.error('Error adding permit:', error.message);
      throw error;
    }
  },
  async getAll() {
    try {
      const querySnapshot = await getDocs(
        query(permitCollection, orderBy('createdAt', 'desc'))
      );
      const permits = [];
      querySnapshot.forEach((doc) => {
        permits.push({ id: doc.id, ...doc.data() });
      });
      return permits;
    } catch (error) {
      console.error('Error fetching permits:', error.message);
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
    } catch (error) {
      console.error('Error updating permit:', error.message);
      throw error;
    }
  },
  async delete(id) {
    try {
      await deleteDoc(doc(permitCollection, id));
      console.log(`🗑️ Permit ${id} deleted successfully`);
    } catch (error) {
      throw error;
    }
  }
};
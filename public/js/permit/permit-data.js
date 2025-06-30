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
  serverTimestamp
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

      console.log(`✅ Permit ${newDocId} added successfully`);
    } catch (error) {
      console.error('❌ Error adding permit:', error.message);
      throw error;
    }
  }
};
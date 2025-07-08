import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { db } from "../firebaseConfig.js";
import { NotificationBox } from "../components/notification.js";

export const ICS = {
  collectionRef: collection(db, "ICS"),
  localStorageKey: "cachedICS",

  // 🔸 Fetch all ICS entries (from cache first)
  async fetchAll() {
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.sort((a, b) => b.data.timestamp?.seconds - a.data.timestamp?.seconds);
    }

    const q = query(this.collectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));

    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    return data;
  },

  // 🔸 Add a new ICS entry
  async add(icsData) {
    try {
      if (!icsData.ICSno || typeof icsData.ICSno !== 'string' || icsData.ICSno.trim() === '') {
        NotificationBox.show('ICS No. is required.');
        return;
      }

      const dataToSave = {
        ...icsData,
        timestamp: serverTimestamp(),
      };

      await addDoc(this.collectionRef, dataToSave);
      localStorage.removeItem(this.localStorageKey); // Invalidate cache
      NotificationBox.show('ICS entry saved successfully!');
    } catch (err) {
      console.error("Error adding ICS entry:", err);
      NotificationBox.show('Error saving ICS entry. Check console for details.');
    }
  },

  // 🔸 Update an existing ICS entry
  async update(docId, updatedData) {
    const docRef = doc(this.collectionRef, docId);
    await updateDoc(docRef, updatedData);
    localStorage.removeItem(this.localStorageKey); // Invalidate cache
  },

  // 🔸 Delete an ICS entry
  async delete(docId) {
    try {
      await deleteDoc(doc(this.collectionRef, docId));
      localStorage.removeItem(this.localStorageKey); // Invalidate cache
    } catch (error) {
      console.error("Error deleting ICS document:", error);
      throw error;
    }
  },

  // 🔸 Force re-fetch from Firestore and update cache
  async refreshCache() {
    const q = query(this.collectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));

    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    return data;
  },

  // 🔸 Fetch ICS assigned to a specific user
  async getICSDataByUserId(userId) {
    const q = query(
      this.collectionRef,
      where("assignedTo", "==", userId),
      orderBy("timestamp", "asc")
    );

    const querySnapshot = await getDocs(q);
    const items = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        qty: data.qty || 0,
        unit: data.unit || "",
        description: data.description || "",
        serialNo: data.serialNo || "",
        unitCost: parseFloat(data.unitCost) || 0,
        totalCost: parseFloat(data.totalCost) || 0,
        ICSno: data.ICSno || "",
        dateIssued: data.dateIssued || "",
        remarks: data.remarks || "",
        attachmentURL: data.attachmentURL || "",
        status: data.status || "",
        timestamp: data.timestamp || null
      });
    });

    return items;
  }
};


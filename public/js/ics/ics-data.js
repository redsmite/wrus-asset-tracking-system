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

  // 🔸 Fetch all ICS entries with document IDs
  async fetchAll() {
    const q = query(this.collectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));
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
  },

  // 🔸 Delete an ICS entry
  async delete(docId) {
    try {
      await deleteDoc(doc(this.collectionRef, docId));
    } catch (error) {
      console.error("Error deleting ICS document:", error);
      throw error;
    }
  },

  async getICSDataByUserId(userId) {
    const q = query(
      collection(db, "ICS"),
      where("assignedTo", "==", userId),
      orderBy("timestamp", "asc") // ✅ Sort by timestamp ascending
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
        timestamp: data.timestamp || null  // 🔥 Optionally include for debugging
      });
    });

    return items;
  }
};

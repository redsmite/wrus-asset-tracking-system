import { db } from "../firebaseConfig.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export const Ledger = {
  collectionRef: collection(db, "ledger"),

  async addEntry({ cid, modifiedBy, amount, remarks, action, assignedTo = "" }) {
    const entry = {
      cid,
      modifiedBy,
      amount: Number(amount),
      remarks: remarks.trim() || "",
      action,
      assignedTo,
      dateModified: serverTimestamp(),
    };

    await addDoc(this.collectionRef, entry);
  },

  async getEntriesByCID(cid) {
    const q = query(
      this.collectionRef,
      where("cid", "==", cid),
      orderBy("dateModified", "desc")
    );

    const ledgerSnapshot = await getDocs(q);

    const ledgerEntries = [];
    const userIds = new Set();

    ledgerSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      ledgerEntries.push({ id: docSnap.id, ...data });
      if (data.assignedTo) {
        userIds.add(data.assignedTo);
      }
    });

    return {
      ledgerEntries,
      userIds: Array.from(userIds),
    };
  },
};

import { db } from "../firebaseConfig.js";
import { Consumable } from "../consumable/consumable-data.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
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
  
  async fetchLedgerDataByCID(selectedCID) {
    if (!selectedCID || typeof selectedCID !== "string" || selectedCID.trim() === "") {
      console.error("Invalid selectedCID:", selectedCID);
      totalQtyDisplay.textContent = "Invalid CID";
      return { totalQty: 0, ledgerEntries: [] };
    }

    try {
      const totalQty = await Consumable.getQty(selectedCID);
      totalQtyDisplay.textContent = (totalQty !== null) ? totalQty : "Not found";

      const { ledgerEntries, userIds } = await Ledger.getEntriesByCID(selectedCID);

      const userMap = {};
      await Promise.all(userIds.map(async userId => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const u = userDoc.data();
            userMap[userId] = `${u.lastName}, ${u.firstName} ${u.middleInitial}.`;
          } else {
            userMap[userId] = "Unknown User";
          }
        } catch {
          userMap[userId] = "Error";
        }
      }));

      // ✅ Enrich ledger with user names
      const enrichedEntries = ledgerEntries.map(entry => ({
        ...entry,
        assignedTo: entry.assignedTo ? (userMap[entry.assignedTo] || "—") : "—"
      }));

      return { totalQty: totalQty ?? 0, ledgerEntries: enrichedEntries };

    } catch (error) {
      console.error("Failed to load ledger or total qty:", error);
      totalQtyDisplay.textContent = "Error";
      return { totalQty: 0, ledgerEntries: [] };
    }
  },
  
  async fetchLedgerByUser(userId) {
    const q = query(
      collection(db, "ledger"),
      where("assignedTo", "==", userId)
    );
    const snapshot = await getDocs(q);
    const entries = [];
    snapshot.forEach((doc) => {
      const d = doc.data();
      entries.push({
        cid: d.cid,                         
        amount: d.amount || 0,              
        dateModified: d.dateModified || null,
        remarks: d.remarks || '-'
      });
    });
    return entries;
  }
};
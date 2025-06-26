import { db } from "../firebaseConfig.js";
import { Ledger } from "../ledger/ledger-data.js";
import {
  collection,
  query,
  getDocs,
  updateDoc, 
  doc,
  orderBy,
  setDoc,
  where,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export const Consumable = {
  collectionRef: collection(db, "consumable"),

  async generateID() {
    const year = new Date().getFullYear();
    const prefix = `${year}-`;

    const q = query(
      this.collectionRef,
      where("__name__", ">=", prefix),
      where("__name__", "<", `${year + 1}-`)
    );

    const snapshot = await getDocs(q);
    const count = snapshot.size + 1;
    const padded = String(count).padStart(3, "0");
    return `${year}-${padded}`;
  },

  async add(spec, qty, unit, addedBy, remarks) {
    const id = await this.generateID();

    const newItem = {
      specification: spec,
      qty: Number(qty),
      unit,
      addedBy,
      timestamp: new Date(),
    };

    const docRef = doc(this.collectionRef, id);
    await setDoc(docRef, newItem);

    await Ledger.addEntry({
      cid: id,
      modifiedBy: addedBy,
      amount: Number(qty),
      remarks: remarks || "Opening stock",
      action: "Add Stock",
    });

    return id;
  },

  async isSpecDuplicate(spec) {
    const specLower = spec.toLowerCase();
    const snapshot = await getDocs(this.collectionRef);

    return snapshot.docs.some(doc => {
      const existingSpec = (doc.data().specification || "").toLowerCase();
      return existingSpec === specLower;
    });
  },

  async fetchAll() {
    const q = query(this.collectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        specification: data.specification,
        qty: data.qty,
        unit: data.unit,
        addedBy: data.addedBy,
        timestamp: data.timestamp?.toDate().toLocaleString() || "N/A",
      };
    });
  },

  async update(cid, updatedData) {
      const docRef = doc(this.collectionRef, cid);
      await updateDoc(docRef, updatedData);
    },

  async addStock(cid, amount, remarks = "") {
      const docRef = doc(this.collectionRef, cid);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) throw new Error("Item not found");

      const newQty = (snapshot.data().qty || 0) + amount;
      await updateDoc(docRef, { qty: newQty });

      await Ledger.addEntry({
        cid,
        modifiedBy: localStorage.getItem("userFullName") || "Unknown",
        amount,
        remarks,
        action: "Add Stock",
      });
    },

  async assignItem(cid, amount, assignedTo, remarks = "") {
    const docRef = doc(this.collectionRef, cid);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) throw new Error("Item not found");

    const currentQty = snapshot.data().qty || 0;

    if (amount > currentQty) {
      throw new Error(`Cannot assign more than available quantity (${currentQty}).`);
    }

    const newQty = currentQty - amount;
    await updateDoc(docRef, { qty: newQty });

    await Ledger.addEntry({
      cid,
      modifiedBy: localStorage.getItem("userFullName") || "Unknown",
      amount,
      remarks,
      action: "Assign Item",
      assignedTo,
    });
  },

  async getQty(cid) {
  const docRef = doc(this.collectionRef, cid);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null; // Or throw new Error("Item not found");
  }

  const data = snapshot.data();
  return data.qty ?? 0;
  },
  async fetchConsumablesMap() {
    const snapshot = await getDocs(collection(db, "consumable"));
    const map = {};
    snapshot.forEach((doc) => {
      const d = doc.data();
      map[doc.id] = {
        specification: d.specification || "",
        unit: d.unit || "",
      };
    });
    return map;
  }
};

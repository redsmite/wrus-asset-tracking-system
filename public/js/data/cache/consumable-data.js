import { db } from "../../firebaseConfig.js";
import { Ledger } from "./ledger-data.js";
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
  localStorageKey: "cachedConsumables",

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

    // Append to cache instead of invalidating
    const cached = localStorage.getItem(this.localStorageKey);
    const data = cached ? JSON.parse(cached) : [];
    data.unshift({
      id,
      ...newItem,
      timestamp: newItem.timestamp.toLocaleString(),
    });
    localStorage.setItem(this.localStorageKey, JSON.stringify(data));

    return id;
  },

  async isSpecDuplicate(spec) {
    const cached = localStorage.getItem(this.localStorageKey);
    const consumables = cached ? JSON.parse(cached) : await this.fetchAll();

    const specLower = spec.toLowerCase();
    return consumables.some(item => item.specification.toLowerCase() === specLower);
  },

  async fetchAll() {
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) return JSON.parse(cached);

    const q = query(this.collectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        specification: d.specification,
        qty: d.qty,
        unit: d.unit,
        addedBy: d.addedBy,
        timestamp: d.timestamp?.toDate().toLocaleString() || "N/A",
      };
    });

    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    return data;
  },

  async update(cid, updatedData) {
    const docRef = doc(this.collectionRef, cid);
    await updateDoc(docRef, updatedData);

    // Update cache without clearing it
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) {
      const data = JSON.parse(cached);
      const index = data.findIndex(item => item.id === cid);
      if (index !== -1) {
        data[index] = { ...data[index], ...updatedData };
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      }
    }
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

    // Update cache with new qty
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) {
      const data = JSON.parse(cached);
      const index = data.findIndex(item => item.id === cid);
      if (index !== -1) {
        data[index].qty = newQty;
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      }
    }
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

    // Update cache with new qty
    const cached = localStorage.getItem(this.localStorageKey);
    if (cached) {
      const data = JSON.parse(cached);
      const index = data.findIndex(item => item.id === cid);
      if (index !== -1) {
        data[index].qty = newQty;
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
      }
    }
  },

  async getQty(cid) {
    const docRef = doc(this.collectionRef, cid);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return data.qty ?? 0;
  },

  async fetchConsumablesMap() {
    const cached = localStorage.getItem(this.localStorageKey);
    const items = cached ? JSON.parse(cached) : await this.fetchAll();

    const map = {};
    items.forEach(item => {
      map[item.id] = {
        specification: item.specification || "",
        unit: item.unit || "",
      };
    });

    return map;
  },

  async refreshCache() {
    const q = query(this.collectionRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        specification: d.specification,
        qty: d.qty,
        unit: d.unit,
        addedBy: d.addedBy,
        timestamp: d.timestamp?.toDate().toLocaleString() || "N/A",
      };
    });

    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    return data;
  },

  async autoRefreshDaily() {
    const key = this.localStorageKey;
    const dateKey = `${key}_lastRefreshDate`;
    const today = new Date().toISOString().split("T")[0];

    const lastRefresh = localStorage.getItem(dateKey);
    if (lastRefresh !== today) {
      await this.refreshCache();
      localStorage.setItem(dateKey, today);
      console.log("[Consumable] Cache auto-refreshed for the day.");
    }
  },

  async autoRefreshEvery8Hours() {
    const key = "cachedConsumable_lastRefresh";
    const now = Date.now();
    const last = localStorage.getItem(key);

    if (!last || now - parseInt(last, 10) > 8 * 60 * 60 * 1000) {
      await this.refreshCache();
      localStorage.setItem(key, now.toString());
      console.log("[Consumable] Cache refreshed (8-hour interval).");
    }
  }
};

import { db } from "../firebaseConfig.js";
import { Ledger } from "./ledger-data.js";
import { Users } from "../user/user-data.js"; 
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
}
};

export async function populateUserSelect() {
  const userSelect = document.getElementById("userSelect");
  if (!userSelect) return;

  userSelect.innerHTML = '';

  // Default placeholder option
  const defaultOption = document.createElement("option");
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select user';
  userSelect.appendChild(defaultOption);

  // Fetch users
  const users = await Users.fetchAllAsc();

  users.forEach(user => {
    if (user.status === 'active') {
      const fullName = `${user.lastName}, ${user.firstName} ${user.middleInitial || ''}.`;
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = fullName.trim();
      userSelect.appendChild(option);
    }
  });
}

export async function fetchLedgerDataByCID(selectedCID) {
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
}

import { db } from "./firebaseConfig.js";
import {
  collection,
  query,
  getDocs,
  updateDoc, 
  doc,
  orderBy,
  setDoc,
  where,
  serverTimestamp,
  addDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// ✅ Named export
export async function generateConsumableID() {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;

  const q = query(
    collection(db, "consumable"),
    where("__name__", ">=", prefix),
    where("__name__", "<", `${year + 1}-`)
  );

  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;

  const padded = String(count).padStart(3, "0");
  return `${year}-${padded}`;
}

// ✅ Named export
export async function addConsumable(spec, qty, unit, addedBy) {
  const id = await generateConsumableID();

  const newItem = {
    specification: spec,
    qty: Number(qty),
    unit,
    addedBy,
    timestamp: new Date()
  };

  const docRef = doc(db, "consumable", id);
  await setDoc(docRef, newItem);

  return id;
}

export async function fetchConsumables() {
  const consumablesRef = collection(db, "consumable");
  const q = query(consumablesRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  const items = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    items.push({
      id: doc.id, // CID
      specification: data.specification,
      qty: data.qty,
      unit: data.unit,
      addedBy: data.addedBy,
      timestamp: data.timestamp?.toDate().toLocaleString() || "N/A"
    });
  });

  return items;
}

export async function updateConsumable(cid, updatedData) {
  const docRef = doc(db, "consumable", cid);
  await updateDoc(docRef, updatedData);
}

// document.getElementById("confirmAddStockBtn").addEventListener("click", async () => {
//   const amount = parseInt(document.getElementById("stockAmount").value);
//   if (!amount || amount <= 0 || !selectedCID) return alert("Invalid amount.");

//   const consumableRef = doc(db, "consumables", selectedCID);
//   const snapshot = await getDoc(consumableRef);
//   if (!snapshot.exists()) return alert("Item not found.");

//   const newQty = (snapshot.data().qty || 0) + amount;
//   await updateDoc(consumableRef, { qty: newQty });

//   const year = new Date().getFullYear();
//   const ledgerRef = collection(db, "ledger");
//   await addDoc(ledgerRef, {
//     LID: `${year}-${Math.floor(100 + Math.random() * 900)}`, // Format: 2025-XXX
//     cid: selectedCID,
//     modifiedBy: localStorage.getItem("userFullName") || "Unknown",
//     dateModified: serverTimestamp(),
//     action: "Add Stock",
//     assignedTo: "",
//     amount: amount,
//   });

//   const modal = bootstrap.Modal.getInstance(document.getElementById("addStockModal"));
//   modal.hide();
//   renderConsumableTable();
// });

export async function addStock(cid, amount) {
  const consumableRef = doc(db, "consumable", cid); // ✅ correct collection name

  const snapshot = await getDoc(consumableRef);
  if (!snapshot.exists()) throw new Error("Item not found");

  const newQty = (snapshot.data().qty || 0) + amount;
  await updateDoc(consumableRef, { qty: newQty });

  const year = new Date().getFullYear();
  await addDoc(collection(db, "ledger"), {
    LID: `${year}-${Math.floor(100 + Math.random() * 900)}`,
    cid: cid,
    modifiedBy: localStorage.getItem("userFullName") || "Unknown",
    dateModified: serverTimestamp(),
    action: "Add Stock",
    assignedTo: "",
    amount: amount,
  });
}
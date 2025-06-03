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

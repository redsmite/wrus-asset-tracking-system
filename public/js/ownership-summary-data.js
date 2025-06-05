import { db } from "./firebaseConfig.js";
import { 
  collection, 
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export async function fetchUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  const users = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      id: doc.id,
      lastName: data.lastName || '',
      firstName: data.firstName || '',
      middleInitial: data.middleInitial || ''
    });
  });

  return users;
}

export async function fetchConsumablesMap() {
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

// 3) Fetch all ledger entries where assignedTo === userId
export async function fetchLedgerByUser(userId) {
  const q = query(
    collection(db, "ledger"),
    where("assignedTo", "==", userId)
  );
  const snapshot = await getDocs(q);
  const entries = [];
  snapshot.forEach((doc) => {
    const d = doc.data();
    entries.push({
      cid: d.cid,           // Assuming your ledger docs store the field “cid”
      amount: d.amount || 0 // and “amount” is a Number field
    });
  });
  return entries; 
}
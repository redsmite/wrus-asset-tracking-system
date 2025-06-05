// ics-data.js
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

export async function getUsers() {
  const usersRef = collection(db, "users"); // ✅ db must come from getFirestore(app)
  const snapshot = await getDocs(usersRef);
  const users = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      id: doc.id,
      ...data,
    });
  });

  return users;
}

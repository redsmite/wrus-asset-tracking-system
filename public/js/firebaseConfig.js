// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgV8tXzZWZyNPEbK6O305hwJcRqkxqBxU",
  authDomain: "wrus-asset-tracking-system.firebaseapp.com",
  projectId: "wrus-asset-tracking-system",
  storageBucket: "wrus-asset-tracking-system.appspot.com",
  messagingSenderId: "946198823737",
  appId: "1:946198823737:web:8966ed475b86e188489ee8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const docRef = doc(db, "users", username);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();

          if (userData.password === password) {
            console.log("Login successful!");
            // Optionally store user info in localStorage
            localStorage.setItem("loggedInUser", username);
            window.location.href = "dashboard.html";
          } else {
            alert("Incorrect password.");
          }
        } else {
          alert("User not found.");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("Something went wrong. Please try again.");
      }
    });
  }
});
import { db } from "./firebaseConfig.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const userData = docSnap.data();
          const hashedPassword = userData.password;
          const userRole = userData.role;

          const isMatch = bcrypt.compareSync(password, hashedPassword);

          if (isMatch) {
            // Store the document ID (e.g., "admin"), not the username field (e.g., "adminUser")
            localStorage.setItem("loggedInUser", docSnap.id);
            localStorage.setItem("userRole", userRole);

            // Redirect based on role
            if (userRole === "admin") {
              window.location.href = "admin-dashboard.html";
            } else {
              window.location.href = "dashboard.html";
            }
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

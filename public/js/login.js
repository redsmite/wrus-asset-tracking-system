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

          const userRole = userData.role?.toLowerCase();
          const userStatus = userData.status?.toLowerCase();
          const userType = userData.type || ''; // 👈 extract type

          // 🚫 Block login if non-admin and status is inactive
          if (userRole !== "admin" && userStatus === "inactive") {
            alert("Your account is inactive. Please contact the administrator.");
            return;
          }

          const hashedPassword = userData.password;
          const isMatch = bcrypt.compareSync(password, hashedPassword);

          if (isMatch) {
            const fullName = `${userData.firstName} ${userData.middleInitial}. ${userData.lastName}`;

            localStorage.setItem("userFullName", fullName);
            localStorage.setItem("loggedInUser", docSnap.id);
            localStorage.setItem("userRole", userRole);
            localStorage.setItem("wrusUserId", docSnap.id);
            localStorage.setItem("userType", userType);

            window.location.href = userRole === "admin" ? "admin-dashboard.html" : "dashboard.html";
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

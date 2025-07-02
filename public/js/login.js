import { db } from "./firebaseConfig.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

import { PortalLoader } from './components/portalLoader.js';
import { PortalAlert } from './components/loginAlert.js';
import { LoginSuccess } from './components/loginSuccess.js';
import { PortalLight } from './components/PortalLight.js';



document.addEventListener('DOMContentLoaded', () => {
  PortalLoader.render();
  LoginSuccess.render();
  PortalLight.render();

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      PortalLoader.show();

      try {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const userData = docSnap.data();

          const userRole = userData.role?.toLowerCase();
          const userStatus = userData.status?.toLowerCase();
          const userType = userData.type || '';

          if (userRole !== "admin" && userStatus === "inactive") {
            PortalLoader.hide();
            PortalAlert.show("Your account is inactive. Please contact the administrator.");
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

          PortalLoader.hide();
          LoginSuccess.show();
          PortalLight.trigger();

          // ✅ Add delay before redirecting so the overlay is visible
          setTimeout(() => {
            window.location.href = userRole === "admin" ? "admin-dashboard.html" : "dashboard.html";
          }, 4000); // 4 seconds
        } else {
            PortalLoader.hide();
            PortalAlert.show("Incorrect password.");
          }
        } else {
          PortalLoader.hide();
          PortalAlert.show("User not found.");
        }

      } catch (error) {
        PortalLoader.hide();
        console.error("Login error:", error);
        PortalAlert.show("Something went wrong. Please try again.");
      }
    });
  }
});
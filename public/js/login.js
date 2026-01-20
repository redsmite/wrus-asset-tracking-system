import { AuthHandler } from "./auth/auth.js";
import { PortalLoader } from './components/portalLoader.js';
import { PortalAlert } from './components/loginAlert.js';
import { LoginSuccess } from './components/loginSuccess.js';
import { PortalLight } from './components/PortalLight.js';

document.addEventListener('DOMContentLoaded', () => {
  AuthHandler.checkLoginStatus();
  PortalLoader.render();
  LoginSuccess.render();
  PortalLight.render();

  const loginForm = document.getElementById('loginForm');

  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    PortalLoader.show();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        PortalLoader.hide();
        PortalAlert.show(data.message || "Login failed.");
        return;
      }

      const {
        userId,
        fullName,
        role,
        type
      } = data;

      localStorage.setItem("userFullName", fullName);
      localStorage.setItem("loggedInUser", userId);
      localStorage.setItem("userRole", role);
      localStorage.setItem("wrusUserId", userId);
      localStorage.setItem("userType", type);

      PortalLoader.hide();
      LoginSuccess.show();

      setTimeout(() => {
        window.location.href =
          role === "admin" ? "admin-dashboard.html" : "dashboard.html";
      }, 1500);

    } catch (err) {
      PortalLoader.hide();
      console.error("Login error:", err);
      PortalAlert.show("Server error. Please try again.");
    }
  });
});

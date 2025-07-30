export const AuthHandler = {
  checkLoginStatus() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const userRole = localStorage.getItem("userRole");

    if (loggedInUser) {
      this.redirectUser(userRole);
    }
  },

  redirectUser(role) {
    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  }
};

export const SessionGuard = {
  ensureLoggedIn() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
      window.location.href = "index.html";
    }
  }
};

export const AdminGuard = {
  verify() {
    const user = localStorage.getItem("loggedInUser");
    const userRole = localStorage.getItem("userRole");

    // Redirect if not logged in
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // Redirect if role is not admin
    if (userRole !== "admin") {
      window.location.href = "404.html";
    }
  }
};
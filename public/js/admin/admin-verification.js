document.addEventListener("DOMContentLoaded", () => {
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
    return;
  }

  // Logout for desktop
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userFullName");
      localStorage.removeItem("userRole");
      window.location.href = "index.html";
    });
  }

  // Logout for mobile
  const logoutBtnMobile = document.getElementById("logoutBtnMobile");
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userFullName");
      localStorage.removeItem("userRole");
      window.location.href = "index.html";
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const loggedInUser = localStorage.getItem("loggedInUser");
  const userRole = localStorage.getItem("userRole");

  if (loggedInUser) {
    // Redirect based on role
    if (userRole === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
    return; // Prevent further script execution
  }

  // Your login form event listener logic can go below this
});
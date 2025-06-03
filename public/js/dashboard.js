document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("loggedInUser");

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  console.log("User logged in:", user);

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userFullName"); // optional cleanup
      window.location.href = "index.html";
    });
  }

  // ✅ Load full name from localStorage and display it
  const welcomeText = document.getElementById("welcomeText");
  const userFullName = localStorage.getItem("userFullName");

  console.log("Loaded full name:", userFullName);

  if (welcomeText && userFullName) {
    welcomeText.textContent = `Welcome ${userFullName}`;
  }
});

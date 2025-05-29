// Protect dashboard
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
      window.location.href = "index.html";
    });
  }

  // 🔄 Optional: display data from Firestore
  // import and fetch your Firestore data here
});

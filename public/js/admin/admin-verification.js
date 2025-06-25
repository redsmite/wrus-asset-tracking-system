export function adminVerification(){
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
}
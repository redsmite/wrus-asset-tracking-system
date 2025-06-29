import { initializePage } from './ics-ui.js'

document.addEventListener('DOMContentLoaded', () => {
  const userRole = localStorage.getItem('userRole');
  const userType = localStorage.getItem("userType");
  checkAccessAndInitialize(userType, userRole);
});

function checkAccessAndInitialize(userType, userRole) {
  if (userType !== "Permanent" && userRole !== 'admin') {
    const pageContent = document.getElementById("page-content");
    if (pageContent) {
      pageContent.innerHTML = "<p class='text-danger'>Access denied.</p>";
    }
  } else {
    initializePage();
  }
}
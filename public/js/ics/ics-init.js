import { Sidebar } from '../components/sidebar.js';
import { Spinner } from '../components/spinner.js';
import {
  setupAddBtn,
  setupAddQtyAndCostListeners,
  setupEditQtyAndCostListeners,
  setupFileValidation,
  setupEditICSFormSubmit,
  setupICSFormSubmit,
  renderICSTable,
  applySearchFilter,
  initDeleteICSButton
} from './ics-ui.js'

document.addEventListener('DOMContentLoaded', () => {

  const userRole = localStorage.getItem('userRole');
  const userType = localStorage.getItem("userType");

  Sidebar.render();
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

function initializePage() {
  Spinner.render();
  setupAddBtn();
  setupAddQtyAndCostListeners();
  setupEditQtyAndCostListeners();
  setupFileValidation();
  setupICSFormSubmit();
  renderICSTable();
  initDeleteICSButton();
  document.getElementById("searchBar").addEventListener("input", applySearchFilter);
  setupEditICSFormSubmit();
}
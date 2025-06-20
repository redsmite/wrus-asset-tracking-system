import {
  fetchUsers,
  fetchConsumablesMap,
  fetchLedgerByUser,
  generateConsumablePDF
} from "./ownership-summary-data.js";
import { renderSidebar } from './components/sidebar.js';
import { renderSpinner, showSpinner, hideSpinner } from './components/spinner.js';

let users = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 10;

let tableBody, searchInput, pageContent, paginationNav, modalElement, bsModal;

// ────────────────────────────
// Event Listeners and Helpers
// ────────────────────────────

function setupLogoutButtons() {
  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  };

  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
  document.getElementById("logoutBtnMobile")?.addEventListener("click", handleLogout);
}

function setupSearchHandler() {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    filteredUsers = users.filter((u) => {
      const fullName = `${u.lastName}, ${u.firstName} ${u.middleInitial}`.toLowerCase();
      return fullName.includes(query);
    });
    currentPage = 1;
    renderTable();
  });
}

function setupConsumableButton(button, user) {
  button.addEventListener("click", async () => {
    showSpinner();
    try {
      const [consumablesMap, ledgerEntries] = await Promise.all([
        fetchConsumablesMap(),
        fetchLedgerByUser(user.id),
      ]);

      ledgerEntries.sort((a, b) => {
        if (!a.dateModified) return 1;
        if (!b.dateModified) return -1;
        return b.dateModified.toMillis() - a.dateModified.toMillis();
      });

      await generateConsumablePDF(user, ledgerEntries, consumablesMap);
      bsModal.show();
    } finally {
      hideSpinner();
    }
  });
}

function renderPagination(totalPages) {
  paginationNav.innerHTML = "";
  const ul = document.createElement("ul");
  ul.className = "pagination";

  const addPageItem = (text, isDisabled, onClick, isActive = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${isDisabled ? "disabled" : ""} ${isActive ? "active" : ""}`;
    const btn = document.createElement("button");
    btn.className = "page-link";
    btn.textContent = text;
    btn.onclick = onClick;
    li.appendChild(btn);
    ul.appendChild(li);
  };

  addPageItem("Previous", currentPage === 1, () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  for (let i = 1; i <= totalPages; i++) {
    addPageItem(i, false, () => {
      currentPage = i;
      renderTable();
    }, i === currentPage);
  }

  addPageItem("Next", currentPage === totalPages, () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  paginationNav.appendChild(ul);
}

function renderTable() {
  showSpinner();
  try {
    tableBody.innerHTML = "";

    const startIndex = (currentPage - 1) * usersPerPage;
    const pageUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

    pageUsers.forEach((user) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
      row.appendChild(nameCell);

      const consumableCell = document.createElement("td");
      const consumableBtn = document.createElement("button");
      consumableBtn.textContent = "View Consumable";
      consumableBtn.className = "btn btn-success golden-button";
      consumableBtn.setAttribute("data-id", user.id);
      setupConsumableButton(consumableBtn, user);
      consumableCell.appendChild(consumableBtn);
      row.appendChild(consumableCell);

      const icsCell = document.createElement("td");
      const icsBtn = document.createElement("button");
      icsBtn.textContent = "View ICS";
      icsBtn.className = "btn btn-info golden-button";
      icsBtn.setAttribute("data-id", user.id);
      icsCell.appendChild(icsBtn);
      row.appendChild(icsCell);

      tableBody.appendChild(row);
    });

    renderPagination(Math.ceil(filteredUsers.length / usersPerPage));
  } finally {
    hideSpinner();
  }
}

// ────────────────────────────
// DOMContentLoaded
// ────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar();
  renderSpinner();

  users = await fetchUsers();
  filteredUsers = [...users];

  tableBody = document.getElementById("usersTableBody");
  searchInput = document.getElementById("searchInput");
  pageContent = document.getElementById("page-content");
  modalElement = document.getElementById("consumableModal");

  if (!modalElement) {
    console.error("Modal element #consumableModal not found in DOM!");
    return;
  }

  bsModal = new bootstrap.Modal(modalElement);

  paginationNav = document.createElement("nav");
  paginationNav.className = "d-flex justify-content-center mt-3";
  pageContent.appendChild(paginationNav);

  setupLogoutButtons();
  setupSearchHandler();
  renderTable();
});

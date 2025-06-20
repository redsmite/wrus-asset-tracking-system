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
const usersPerPage = 8;

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
    usersTableBody.innerHTML = "";

    const startIndex = (currentPage - 1) * usersPerPage;
    const pageUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

    pageUsers.forEach((user) => {
      const row = document.createElement("tr");

      // Name cell
      const nameCell = document.createElement("td");
      nameCell.textContent = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
      nameCell.classList.add("fw-medium", "text-capitalize");
      row.appendChild(nameCell);

      // Consumable button cell
      const consumableCell = document.createElement("td");
      const consumableBtn = document.createElement("button");
      consumableBtn.className = "btn btn-success btn-sm rounded-pill fw-semibold px-3";
      consumableBtn.innerHTML = `<i class="bi bi-box-arrow-in-down me-1"></i>View Consumable`;
      consumableBtn.setAttribute("data-id", user.id);
      setupConsumableButton(consumableBtn, user);
      consumableCell.classList.add("text-center");
      consumableCell.appendChild(consumableBtn);
      row.appendChild(consumableCell);

      // ICS button cell
      const icsCell = document.createElement("td");
      const icsBtn = document.createElement("button");
      icsBtn.className = "btn btn-info btn-sm rounded-pill fw-semibold px-3 text-white";
      icsBtn.innerHTML = `<i class="bi bi-card-list me-1"></i>View ICS`;
      icsBtn.setAttribute("data-id", user.id);
      icsCell.classList.add("text-center");
      icsCell.appendChild(icsBtn);
      row.appendChild(icsCell);

      usersTableBody.appendChild(row);
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

import { generatePdfICS } from "../pdf/ics-pdf.js";
import { generateConsumablePDF } from "../pdf/user-consumable-pdf.js"
import { Consumable } from "../data/cache/consumable-data.js";
import { Ledger } from "../data/cache/ledger-data.js";
import { ICS } from "../data/cache/ics-data.js";
import { Users } from "../data/cache/user-data.js";
import { Sidebar } from '../components/sidebar.js';
import { Spinner } from '../components/spinner.js';

// Global variables
let users = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 10;

// INIT FUNCTIONS
let tableBody, searchInput, pageContent, paginationNav, modalElement, bsModal;

export function initDOMElements() {
  tableBody = document.getElementById("usersTableBody");
  searchInput = document.getElementById("searchInput");
  pageContent = document.getElementById("page-content");
  modalElement = document.getElementById("consumableModal");

  if (!modalElement) {
    console.error("Modal element #consumableModal not found!");
    return;
  }

  bsModal = new bootstrap.Modal(modalElement);

  paginationNav = document.createElement("nav");
  paginationNav.className = "d-flex justify-content-center mt-3";
  pageContent.appendChild(paginationNav);
}

export function initUI() {
  Sidebar.render();
  Spinner.render();
  hideSearchIfNotAdmin();
  setupSearchHandler();
  setupGenerateICSHandler();
}

// DATA LOADING
export async function loadData() {
  Spinner.show();
  try {
    users = await Users.fetchUsersSummary();
    filteredUsers = [...users];
  } finally {
    Spinner.hide();
  }
}

// SEARCH & FILTER
function setupSearchHandler() {
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    filteredUsers = users.filter(u => {
      const fullName = `${u.lastName}, ${u.firstName} ${u.middleInitial}`.toLowerCase();
      return fullName.includes(query);
    });
    currentPage = 1;
    renderTable();
  });
}

function hideSearchIfNotAdmin() {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "admin") {
    searchInput?.style.setProperty("display", "none");
  }
}

// TABLE RENDER
export function renderTable() {
  Spinner.show();
  try {
    tableBody.innerHTML = "";

    const currentUserId = localStorage.getItem("wrusUserId");
    const isAdmin = currentUserId === "admin";

    const visibleUsers = isAdmin
      ? filteredUsers
      : filteredUsers.filter(user =>
          user.id === currentUserId || (!user.type || user.type.trim() === '')
        );

    const start = (currentPage - 1) * usersPerPage;
    const pageUsers = visibleUsers.slice(start, start + usersPerPage);

    pageUsers.forEach(user => {
      const row = document.createElement("tr");
      row.appendChild(createNameCell(user));
      row.appendChild(createConsumableCell(user));
      row.appendChild(createICSCell(user));
      tableBody.appendChild(row);
    });

    renderPagination(Math.ceil(visibleUsers.length / usersPerPage));
  } finally {
    Spinner.hide();
  }
}

// TABLE CELLS
function createNameCell(user) {
  const cell = document.createElement("td");
  cell.textContent = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
  cell.classList.add("fw-medium", "text-capitalize");
  return cell;
}

function createConsumableCell(user) {
  const cell = document.createElement("td");
  cell.classList.add("text-center");

  const btn = document.createElement("button");
  btn.className = "btn btn-3d btn-water btn-sm px-2 py-1 fw-semibold rounded";
  btn.innerHTML = `<i class="bi bi-box-arrow-in-down me-1"></i>Consumable`;
  btn.setAttribute("data-id", user.id);

  btn.addEventListener("click", async () => {
    Spinner.show();
    try {
      const [consumablesMap, ledgerEntries] = await Promise.all([
        Consumable.fetchConsumablesMap(),
        Ledger.fetchLedgerByUser(user.id)
      ]);

      ledgerEntries.sort((a, b) => (b.dateModified?.toMillis() || 0) - (a.dateModified?.toMillis() || 0));

      await generateConsumablePDF(user, ledgerEntries, consumablesMap);
      bsModal.show();
    } finally {
      Spinner.hide();
    }
  });

  cell.appendChild(btn);
  return cell;
}

function createICSCell(user) {
  const cell = document.createElement("td");
  cell.classList.add("text-center");

  if (user.type !== "Permanent") {
    return cell;
  }

  const btn = document.createElement("button");
  btn.className = "btn btn-3d btn-water-alt btn-sm px-2 py-1 fw-semibold rounded";
  btn.innerHTML = `<i class="bi bi-card-list me-1"></i>ICS`;
  btn.setAttribute("data-id", user.id);

  btn.addEventListener("click", () => {
    showPropertyModal({
      lastName: user.lastName,
      firstName: user.firstName,
      middleInitial: user.middleInitial
    }, user.id);
  });

  cell.appendChild(btn);
  return cell;
}

// PAGINATION
function renderPagination(totalPages) {
  paginationNav.innerHTML = "";
  const ul = document.createElement("ul");
  ul.className = "pagination";

  const addItem = (label, disabled, onClick, active = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;

    const btn = document.createElement("button");
    btn.className = "page-link";
    btn.textContent = label;
    btn.onclick = onClick;

    li.appendChild(btn);
    ul.appendChild(li);
  };

  // Previous button
  addItem("Previous", currentPage === 1, () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  // Calculate page range (max 5 at a time)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + 4;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - 4);
  }

  // Numbered buttons (limited to 5)
  for (let i = startPage; i <= endPage; i++) {
    addItem(i, false, () => {
      currentPage = i;
      renderTable();
    }, i === currentPage);
  }

  // Next button
  addItem("Next", currentPage === totalPages, () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  paginationNav.appendChild(ul);
}

//  PROPERTY MODAL FOR ICS
async function showPropertyModal(userFullName, userId) {
  document.getElementById("fullName").textContent =
    `${userFullName.lastName}, ${userFullName.firstName} ${userFullName.middleInitial}.`;

  const generateBtn = document.getElementById("generatePdfBtn");
  generateBtn.dataset.userid = userId;

  const icsTableBody = document.getElementById("icsTableBody");
  const totalAmountSpan = document.getElementById("totalAmount");

  icsTableBody.innerHTML = "";
  totalAmountSpan.textContent = "₱0.00";

  const allICSItems = await ICS.getICSDataByUserId(userId);
  const icsItems = allICSItems.filter(item => item.status !== 'RTS');

  let totalAmount = 0;
  icsItems.forEach(item => {
    totalAmount += item.totalCost;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.qty}</td>
      <td>${item.unit}</td>
      <td>${item.description}</td>
      <td>${item.serialNo}</td>
      <td>₱${item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td>₱${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td>${item.ICSno}</td>
      <td>${item.dateIssued}</td>
      <td>${item.remarks}</td>
      <td>
        ${item.attachmentURL
          ? `<a href="${item.attachmentURL}" target="_blank" class="btn btn-3d btn-sm btn-outline-primary">View PDF</a>`
          : '<span class="text-muted">N/A</span>'}
      </td>
    `;
    icsTableBody.appendChild(row);
  });

  totalAmountSpan.textContent = `₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const modal = new bootstrap.Modal(document.getElementById("propertyModal"));
  modal.show();
}

// PDF GENERATION
function setupGenerateICSHandler() {
  document.getElementById("generatePdfBtn")?.addEventListener("click", () => {
    const userId = document.getElementById("generatePdfBtn").dataset.userid;
    if (userId) {
      generatePdfICS(userId);
    }
  });
}

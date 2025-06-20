import {
  fetchConsumables,
  addConsumable,
  isSpecDuplicate,
  updateConsumable,
  addStock,
  populateUserSelect,
  handleAssignConsumable,
  renderLedgerTable,
  generateLedgerPDFBlob
} from "./consumable-data.js";
import { renderSidebar } from './components/sidebar.js';
import { renderSpinner, showSpinner, hideSpinner } from './components/spinner.js';

let selectedCID = null;
let currentItems = [];
let filteredItems = [];
let currentPage = 1;
let currentQty = 0;
const pageSize = 8;

document.addEventListener("DOMContentLoaded", () => {
  renderSidebar();
  renderSpinner(); 
  initializeEventListeners();
  renderConsumableTable();
});

function initializeEventListeners() {
  document.getElementById("showAddFormBtn")?.addEventListener("click", () => {
    new bootstrap.Modal(document.getElementById("addItemModal")).show();
  });

  document.getElementById("addItemBtn")?.addEventListener("click", handleAddItem);
  document.getElementById("saveEditBtn")?.addEventListener("click", handleSaveEdit);
  document.getElementById("addStockBtn")?.addEventListener("click", openAddStockModal);
  document.getElementById("confirmAddStockBtn")?.addEventListener("click", handleAddStock);
  document.getElementById("assignItemBtn")?.addEventListener("click", openAssignModal);
  document.getElementById("confirmAssignBtn")?.addEventListener("click", handleConfirmAssign);
  document.getElementById("viewLedgerBtn")?.addEventListener("click", handleViewLedger);
  document.getElementById("searchInput")?.addEventListener("input", handleSearchInput);

  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
  document.getElementById("logoutBtnMobile")?.addEventListener("click", handleLogout);

  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const actionBtn = e.target.closest(".action-btn");

    if (editBtn) {
      const id = editBtn.dataset.id;
      selectedCID = id;
      document.getElementById("editCID").value = id;
      document.getElementById("editSpec").value = editBtn.dataset.spec;
      document.getElementById("editUnit").value = editBtn.dataset.unit;
    }

    if (actionBtn) {
      selectedCID = actionBtn.dataset.id;
      currentQty = parseInt(actionBtn.dataset.qty || "0");
    }
  });
}

const addItemModal = new bootstrap.Modal(document.getElementById("addItemModal"));

async function handleAddItem() {
  showSpinner();

  try {
    const spec = document.getElementById("newSpec").value.trim();
    const qty = document.getElementById("newQty").value.trim();
    const unit = document.getElementById("newUnit").value.trim();
    const remarks = document.getElementById("newRemarks").value.trim();
    const addedBy = localStorage.getItem("userFullName") || "Unknown";

    if (!spec || !qty || !unit) return;

    const duplicate = await isSpecDuplicate(spec);
    if (duplicate) return alert("An item with the same specification already exists.");

    await addConsumable(spec, qty, unit, addedBy, remarks);
    alert("Consumable Item successfully added!");

    document.getElementById("newSpec").value = "";
    document.getElementById("newQty").value = "";
    document.getElementById("newUnit").value = "";
    document.getElementById("newRemarks").value = "";
    addItemModal.hide();
    renderConsumableTable();
  } finally {
    hideSpinner();
  }
}

async function handleSaveEdit() {
  showSpinner();
  try {
    const cid = document.getElementById("editCID").value;
    const spec = document.getElementById("editSpec").value.trim();
    const unit = document.getElementById("editUnit").value.trim();

    if (!spec || !unit) return;

    selectedCID = cid; // ✅ Make sure global selectedCID gets updated

    await updateConsumable(cid, { specification: spec, unit });
    bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    renderConsumableTable();
  } finally {
    hideSpinner();
  }
}

function openAddStockModal() {
  bootstrap.Modal.getInstance(document.getElementById("actionModal")).hide();
  document.getElementById("stockAmount").value = "";
  new bootstrap.Modal(document.getElementById("addStockModal")).show();
}

async function handleAddStock() {
  showSpinner();
  const amount = parseInt(document.getElementById("stockAmount").value);
  const remarks = document.getElementById("stockRemarks").value;

  if (!amount || amount <= 0 || !selectedCID) return alert("Invalid amount.");

  try {
    await addStock(selectedCID, amount, remarks);
    bootstrap.Modal.getInstance(document.getElementById("addStockModal")).hide();
    alert("Items received successfully");
    renderConsumableTable();
  } catch (err) {
    console.error("Error adding stock:", err.message);
    alert("Something went wrong. Please try again.");
  } finally {
    hideSpinner();
  }
}

async function openAssignModal() {
  if (!selectedCID) return console.warn("No CID selected.");
  await populateUserSelect();
  new bootstrap.Modal(document.getElementById("assignModal")).show();
}

async function handleConfirmAssign() {
  showSpinner();
  try{
    await handleAssignConsumable(selectedCID);
    renderConsumableTable();
  } finally {
    hideSpinner();
  }
}

async function handleViewLedger() {
  showSpinner();

  try {
    const { totalQty, ledgerEntries } = await renderLedgerTable(selectedCID);
    const blob = await generateLedgerPDFBlob(selectedCID, ledgerEntries, totalQty);
    document.getElementById("pdfPreviewFrame").src = URL.createObjectURL(blob);
    new bootstrap.Modal(document.getElementById("ledgerModal")).show();
  } catch (err) {
    console.error("Error generating ledger:", err);
    alert("Failed to generate ledger.");
  } finally {
    hideSpinner();
  }
}

function handleLogout() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("userFullName");
  window.location.href = "index.html";
}

function handleSearchInput() {
  const term = document.getElementById("searchInput").value.trim().toLowerCase();
  filteredItems = currentItems.filter(item =>
    item.specification.toLowerCase().includes(term)
  );
  currentPage = 1;
  renderTablePage();
  renderPagination();
}

async function renderConsumableTable() {
  showSpinner();

  try {
    currentItems = await fetchConsumables();
    filteredItems = [...currentItems];
    currentPage = 1;
    renderTablePage();
    renderPagination();
  } catch (err) {
    console.error("Error fetching consumables:", err);
    document.getElementById("consumableBody").innerHTML = `<tr><td colspan="8">Error loading items.</td></tr>`;
  } finally {
    hideSpinner();
  }
}

function renderTablePage() {
  const tbody = document.getElementById("consumableBody");
  tbody.innerHTML = "";

  const start = (currentPage - 1) * pageSize;
  const pageItems = filteredItems.slice(start, start + pageSize);

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">No items found.</td></tr>`;
    return;
  }

  pageItems.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.specification}</td>
      <td>${item.qty}</td>
      <td>${item.unit}</td>
      <td>
      <button 
        class="btn btn-warning btn-sm edit-btn" 
        data-id="${item.id}" 
        data-spec="${item.specification}" 
        data-unit="${item.unit}" 
        data-bs-toggle="modal" 
        data-bs-target="#editModal"
      >
        <i class="bi bi-pencil-square"></i>
      </button>
      </td>
      <td>
        <button 
          class="btn btn-secondary btn-sm action-btn" 
          data-id="${item.id}" 
          data-qty="${item.qty}" 
          data-bs-toggle="modal" 
          data-bs-target="#actionModal"
          data-bs-toggle="tooltip" 
          data-bs-placement="top" 
          title="Perform Action"
        >
          <i class="bi bi-gear"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderPagination() {
  const paginationContainer = document.getElementById("paginationContainer");
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.add("btn", "btn-sm", "mx-1", i === currentPage ? "btn-primary" : "btn-outline-primary");
    btn.addEventListener("click", () => {
      currentPage = i;
      renderTablePage();
      renderPagination();
    });
    paginationContainer.appendChild(btn);
  }
}

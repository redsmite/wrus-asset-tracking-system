import { Consumable } from "./consumable-data.js";
import { Ledger } from "../ledger/ledger-data.js"
import { generateLedgerPDFBlob } from '../pdf/item-consumable-pdf.js';
import { Users } from "../user/user-data.js"; 
import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";

let selectedCID = null;
let currentItems = [];
let filteredItems = [];
let currentPage = 1;
let currentQty = 0;
const pageSize = 8;

// ---------- Event Listeners ----------
export function initializePage() {
  Sidebar.render();
  Spinner.render();
  renderConsumableTable();
  initAddItemHandler();
  initEditItemHandler();
  initAddStockHandler();
  initAssignHandler();
  initViewLedgerHandler();
  initSearchHandler();
  initActionButtonHandler();
}

// ---------- Item Handling ----------
function initAddItemHandler() {
  const addItemModal = new bootstrap.Modal(document.getElementById("addItemModal"));

  document.getElementById("showAddFormBtn")?.addEventListener("click", () => {
    addItemModal.show();
  });

  document.getElementById("addItemBtn")?.addEventListener("click", async () => {
    Spinner.show();

    try {
      const spec = document.getElementById("newSpec").value.trim();
      const qty = document.getElementById("newQty").value.trim();
      const unit = document.getElementById("newUnit").value.trim();
      const remarks = document.getElementById("newRemarks").value.trim();
      const addedBy = localStorage.getItem("userFullName") || "Unknown";

      if (!spec || !qty || !unit) {
        alert("Specification, Quantity, and Unit are required.");
        return;
      }

      const duplicate = await Consumable.isSpecDuplicate(spec);
      if (duplicate) {
        alert("An item with the same specification already exists.");
        return;
      }

      await Consumable.add(spec, qty, unit, addedBy, remarks);
      alert("Consumable Item successfully added!");

      // Clear form
      document.getElementById("newSpec").value = "";
      document.getElementById("newQty").value = "";
      document.getElementById("newUnit").value = "";
      document.getElementById("newRemarks").value = "";

      addItemModal.hide();
      renderConsumableTable();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("An error occurred while adding the item.");
    } finally {
      Spinner.hide();
    }
  });
}

function initEditItemHandler() {
  const editModal = new bootstrap.Modal(document.getElementById("editModal"));

  document.getElementById("saveEditBtn")?.addEventListener("click", async () => {
    Spinner.show();

    try {
      const cid = document.getElementById("editCID").value;
      const spec = document.getElementById("editSpec").value.trim();
      const unit = document.getElementById("editUnit").value.trim();

      if (!spec || !unit) {
        alert("Specification and Unit are required.");
        return;
      }

      await Consumable.update(cid, { specification: spec, unit });

      editModal.hide();
      renderConsumableTable();
    } catch (error) {
      console.error("Error updating item:", error);
      alert("An error occurred while updating the item.");
    } finally {
      Spinner.hide();
    }
  });
}

// ---------- Stock Handling ----------
function initAddStockHandler() {
  const actionModal = new bootstrap.Modal(document.getElementById("actionModal"));
  const addStockModal = new bootstrap.Modal(document.getElementById("addStockModal"));

  // Open Add Stock Modal
  document.getElementById("addStockBtn")?.addEventListener("click", () => {
    actionModal.hide();
    document.getElementById("stockAmount").value = "";
    document.getElementById("stockRemarks").value = "";
    addStockModal.show();
  });

  // Confirm Add Stock
  document.getElementById("confirmAddStockBtn")?.addEventListener("click", async () => {
    Spinner.show();

    const amount = parseInt(document.getElementById("stockAmount").value.trim(), 10);
    const remarks = document.getElementById("stockRemarks").value.trim();

    if (isNaN(amount) || amount <= 0 || !selectedCID) {
      Spinner.hide();
      return alert("Invalid amount.");
    }

    const confirmAdd = confirm(
      "Are you sure you want to add to this stock?\nThis action cannot be undone."
    );
    if (!confirmAdd) {
      Spinner.hide();
      return;
    }

    try {
      await Consumable.addStock(selectedCID, amount, remarks);
      
      // Hide both modals after success
      const actionModalInstance = bootstrap.Modal.getInstance(document.getElementById("actionModal"));
      const addStockModalInstance = bootstrap.Modal.getInstance(document.getElementById("addStockModal"));

      addStockModalInstance?.hide();
      actionModalInstance?.hide();

      alert("Items added successfully");
      renderConsumableTable();
    } catch (err) {
      console.error("Error adding stock:", err.message);
      alert("Something went wrong. Please try again.");
    } finally {
      Spinner.hide();
    }
  });
}

// ---------- Assignment ----------
function initAssignHandler() {
  const actionModal = new bootstrap.Modal(document.getElementById("actionModal"));
  const assignModal = new bootstrap.Modal(document.getElementById("assignModal"));

  // Open Assign Modal
  document.getElementById("assignItemBtn")?.addEventListener("click", async () => {
    if (!selectedCID) {
      return console.warn("No CID selected.");
    }

    const userSelect = document.getElementById("userSelect");
    if (!userSelect) return;

    // Populate user dropdown
    userSelect.innerHTML = '';

    const defaultOption = document.createElement("option");
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = 'Select user';
    userSelect.appendChild(defaultOption);

    try {
      const users = await Users.fetchAllAsc();

      users.forEach(user => {
        if (user.status === 'active') {
          const fullName = `${user.lastName}, ${user.firstName} ${user.middleInitial || ''}.`;
          const option = document.createElement("option");
          option.value = user.id;
          option.textContent = fullName.trim();
          userSelect.appendChild(option);
        }
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to load users.");
      return;
    }

    // Show modal
    assignModal.show();
  });

  // Handle Confirm Assign
  document.getElementById("confirmAssignBtn")?.addEventListener("click", async () => {
    Spinner.show();
    try {
      const qtyInput = document.getElementById("assignQty").value.trim();
      const assignedTo = document.getElementById("userSelect").value;
      const remarks = document.getElementById("assignRemarks").value.trim();
      const amount = parseInt(qtyInput, 10);

      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid quantity.");
        return;
      }

      if (!assignedTo) {
        alert("Please select a user to assign to.");
        return;
      }

      // Confirmation prompt
      const confirmAssign = confirm(
        `Are you sure you want to assign ${amount} item(s) to this user?\nThis action cannot be undone.`
      );
      if (!confirmAssign) {
        return;
      }

      await Consumable.assignItem(selectedCID, amount, assignedTo, remarks);
      alert('Items assigned successfully');

      renderConsumableTable();
      assignModal.hide();
      actionModal.hide();
      document.getElementById("assignForm").reset();

    } catch (error) {
      console.error("Error assigning item:", error);
      alert(error.message);
    } finally {
      Spinner.hide();
    }
  });
}

// ---------- Ledger ----------
function initViewLedgerHandler() {
  document.getElementById("viewLedgerBtn")?.addEventListener("click", async () => {
    Spinner.show();
    const totalQtyDisplay = document.getElementById("totalQtyDisplay");

    try {
      const { totalQty, ledgerEntries } = await Ledger.fetchLedgerDataByCID(selectedCID);
      
      totalQtyDisplay.textContent = totalQty !== null ? totalQty : "Not found";

      const blob = await generateLedgerPDFBlob(selectedCID, ledgerEntries, totalQty);
      document.getElementById("pdfPreviewFrame").src = URL.createObjectURL(blob);

      new bootstrap.Modal(document.getElementById("ledgerModal")).show();
    } catch (err) {
      console.error("Error generating ledger:", err);
      alert("Failed to generate ledger.");
    } finally {
      Spinner.hide();
    }
  });
}

function initActionButtonHandler() {
  document.addEventListener("click", (e) => {
    const actionBtn = e.target.closest(".action-btn");
    if (actionBtn) {
      const cid = actionBtn.getAttribute("data-id");
      const qty = actionBtn.getAttribute("data-qty");

      selectedCID = cid;

      const viewLedgerBtn = document.getElementById("viewLedgerBtn");
      viewLedgerBtn.setAttribute("data-id", cid);
    }
  });
}

// ---------- Search ----------
function initSearchHandler() {
  document.getElementById("searchInput")?.addEventListener("input", () => {
    const term = document.getElementById("searchInput").value.trim().toLowerCase();

    filteredItems = currentItems.filter(item =>
      item.specification.toLowerCase().includes(term)
    );

    currentPage = 1;
    renderTablePage();
    renderPagination();
  });
}

// ---------- Table Rendering ----------
async function renderConsumableTable() {
  Spinner.show();

  try {
    currentItems = await Consumable.fetchAll();
    filteredItems = [...currentItems];
    currentPage = 1;
    renderTablePage();
    renderPagination();
  } catch (err) {
    console.error("Error fetching consumables:", err);
    document.getElementById("consumableBody").innerHTML = `<tr><td colspan="8">Error loading items.</td></tr>`;
  } finally {
    Spinner.hide();
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
        <button class="btn btn-warning btn-sm edit-btn" 
          data-id="${item.id}" 
          data-spec="${item.specification}" 
          data-unit="${item.unit}" 
          data-bs-toggle="modal" 
          data-bs-target="#editModal">
          <i class="bi bi-pencil-square"></i>
        </button>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm action-btn" 
          data-id="${item.id}" 
          data-qty="${item.qty}" 
          data-bs-toggle="modal" 
          data-bs-target="#actionModal"
          title="Perform Action">
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

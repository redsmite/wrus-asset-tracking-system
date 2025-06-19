import { fetchConsumables,addConsumable,isSpecDuplicate, updateConsumable, addStock, populateUserSelect, handleAssignConsumable, renderLedgerTable, generateLedgerPDFBlob } from "./consumable-data.js";

let selectedCID = null;
let currentQty = 0;
let currentItems = [];     // all fetched items
let filteredItems = [];    // filtered items after search
let currentPage = 1;
const pageSize = 8;

document.addEventListener("DOMContentLoaded", () => {
    const showAddFormBtn = document.getElementById('showAddFormBtn');
    const addItemModal = new bootstrap.Modal(document.getElementById('addItemModal'));

    showAddFormBtn.addEventListener('click', function () {
      addItemModal.show();
  });

  addItemBtn.addEventListener("click", async () => {
    const spec = document.getElementById("newSpec").value.trim();
    const qty = document.getElementById("newQty").value.trim();
    const unit = document.getElementById("newUnit").value.trim();
    const addedBy = localStorage.getItem("userFullName") || "Unknown";

    if (spec && qty && unit) {
      const duplicate = await isSpecDuplicate(spec);

      if (duplicate) {
        alert("An item with the same specification already exists.");
        return;
      }

      await addConsumable(spec, qty, unit, addedBy);
      alert("Consumable Item successfully added!");
      addItemModal.hide();
      document.getElementById("newSpec").value = "";
      document.getElementById("newQty").value = "";
      document.getElementById("newUnit").value = "";
      // Reload table
      renderConsumableTable();
    }
  });
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  });
}

const logoutBtnMobile = document.getElementById("logoutBtnMobile");
if (logoutBtnMobile) {
  logoutBtnMobile.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderConsumableTable();
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const cid = e.target.dataset.id;
    const spec = e.target.dataset.spec;
    const unit = e.target.dataset.unit;

    document.getElementById("editCID").value = cid;
    document.getElementById("editSpec").value = spec;
    document.getElementById("editUnit").value = unit;
  }
});

document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const cid = document.getElementById("editCID").value;
  const spec = document.getElementById("editSpec").value.trim();
  const unit = document.getElementById("editUnit").value.trim();

  if (spec && unit) {
    await updateConsumable(cid, { specification: spec, unit: unit });
    const modal = bootstrap.Modal.getInstance(document.getElementById("editModal"));
    modal.hide();
    renderConsumableTable();
  }
});


document.addEventListener("click", (e) => {
  // Detect clicks on the Action button
  if (e.target.classList.contains("action-btn")) {
    selectedCID = e.target.dataset.id;
  }
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("action-btn")) {
    selectedCID = e.target.dataset.id;
    currentQty = parseInt(e.target.dataset.qty || "0");
    console.log(selectedCID);
  }
});

document.getElementById("addStockBtn").addEventListener("click", () => {
  const actionModal = bootstrap.Modal.getInstance(document.getElementById("actionModal"));
  actionModal.hide();
  const addStockModal = new bootstrap.Modal(document.getElementById("addStockModal"));
  document.getElementById("stockAmount").value = "";
  addStockModal.show();
});

document.getElementById("confirmAddStockBtn").addEventListener("click", async () => {
  const amount = parseInt(document.getElementById("stockAmount").value);
  const remarks = document.getElementById("stockRemarks").value;

  if (!amount || amount <= 0 || !selectedCID) return alert("Invalid amount.");

  try {
    await addStock(selectedCID, amount, remarks); // ✅ pass remarks
    const modal = bootstrap.Modal.getInstance(document.getElementById("addStockModal"));
    modal.hide();
    alert('Items received successfully');
    renderConsumableTable();
  } catch (err) {
    console.error("Error adding stock:", err.message);
    alert("Something went wrong. Please try again.");
  }
});

//display Assign Item modal
document.getElementById("assignItemBtn").addEventListener("click", async () => {
  if (selectedCID) {
    await populateUserSelect(); // Load users into dropdown
    const assignModal = new bootstrap.Modal(document.getElementById("assignModal"));
    assignModal.show();
  } else {
    console.warn("No CID selected.");
  }
});

document.getElementById("confirmAssignBtn").addEventListener("click", async () => {
  await handleAssignConsumable(selectedCID);
  renderConsumableTable();
});

document.getElementById("viewLedgerBtn").addEventListener("click", async () => {
  const { totalQty, ledgerEntries } = await renderLedgerTable(selectedCID);
  const blob = await generateLedgerPDFBlob(selectedCID, ledgerEntries, totalQty);

  const pdfURL = URL.createObjectURL(blob);
  document.getElementById("pdfPreviewFrame").src = pdfURL;

  const ledgerModal = new bootstrap.Modal(document.getElementById("ledgerModal"));
  ledgerModal.show();
});

//pagination
const tbody = document.getElementById("consumableBody");
const searchInput = document.getElementById("searchInput");

async function renderConsumableTable() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'flex';

  try {
    currentItems = await fetchConsumables();
    filteredItems = [...currentItems];
    currentPage = 1;
    renderTablePage();
    renderPagination();
  } finally {
    loadingOverlay.style.display = 'none'; // Always hide loading
  }
}

// Render a specific page
function renderTablePage() {
  tbody.innerHTML = "";
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filteredItems.slice(start, end);

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
        <button class="btn btn-warning btn-sm edit-btn" data-id="${item.id}" data-spec="${item.specification}" data-unit="${item.unit}" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm action-btn" data-id="${item.id}" data-qty="${item.qty}" data-bs-toggle="modal" data-bs-target="#actionModal">Action</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Search filter
searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  filteredItems = currentItems.filter(item =>
    item.specification.toLowerCase().includes(term)
  );
  currentPage = 1;
  renderTablePage();
  renderPagination();
});

// Render pagination buttons
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

renderConsumableTable();
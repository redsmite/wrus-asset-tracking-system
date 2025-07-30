import { Consumable } from "../data/cache/consumable-data.js";
import { Ledger } from "../data/cache/ledger-data.js"
import { generateLedgerPDFBlob } from '../pdf/item-consumable-pdf.js';
import { Users } from "../data/cache/user-data.js";
import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { NotificationBox, Confirmation } from "../components/notification.js";

let selectedCID = null;
let currentItems = [];
let filteredItems = [];
let currentPage = 1;
let currentQty = 0;
let pageSize = 10;
let currentSearchTerm = '';

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
  initReassignItemModal();
  initSearchHandler();
  initActionButtonHandler();
  pageSizeSelectHandler();
  handleRefreshButton({
    buttonId: "refreshBtn",
    refreshFn: Consumable.refreshCache.bind(Consumable),
    renderFn: renderConsumableTable,
    cooldownKey: "lastConsumableRefresh",
    cooldownSeconds: 60
  });
  setupExportFilteredConsumablesToExcel();
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')                     // Break accented characters
    .replace(/[\u0300-\u036f]/g, '');     // Remove diacritics
}

function highlightMatch(originalText, term) {
  if (!term) return originalText;

  const normalizedOriginal = normalizeText(originalText);
  const normalizedTerm = normalizeText(term);

  const index = normalizedOriginal.indexOf(normalizedTerm);
  if (index === -1) return originalText;

  const before = originalText.slice(0, index);
  const match = originalText.slice(index, index + term.length);
  const after = originalText.slice(index + term.length);

  return `${before}<mark>${match}</mark>${after}`;
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
        NotificationBox.show("Specification, Quantity, and Unit are required.");
        return;
      }

      const duplicate = await Consumable.isSpecDuplicate(spec);
      if (duplicate) {
        NotificationBox.show("An item with the same specification already exists.");
        return;
      }

      await Consumable.add(spec, qty, unit, addedBy, remarks);
      NotificationBox.show("Consumable Item successfully added!");

      // Clear form
      document.getElementById("newSpec").value = "";
      document.getElementById("newQty").value = "";
      document.getElementById("newUnit").value = "";
      document.getElementById("newRemarks").value = "";

      addItemModal.hide();
      renderConsumableTable();
    } catch (error) {
      console.error("Error adding item:", error);
      NotificationBox.show("An error occurred while adding the item.");
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
        NotificationBox.show("Specification and Unit are required.");
        return;
      }

      await Consumable.update(cid, { specification: spec, unit });
      NotificationBox.show("Items description updated succesfully.");
      editModal.hide();
      const searchTerm = document.getElementById("searchInput").value.trim();
      renderConsumableTable(searchTerm);
    } catch (error) {
      console.error("Error updating item:", error);
      NotificationBox.show("An error occurred while updating the item.");
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
  document.getElementById("confirmAddStockBtn")?.addEventListener("click", () => {
    const amount = parseInt(document.getElementById("stockAmount").value.trim(), 10);
    const remarks = document.getElementById("stockRemarks").value.trim();

    if (isNaN(amount) || amount <= 0 || !selectedCID) {
      return NotificationBox.show("Invalid amount.");
    }

    Confirmation.show(
      "Are you sure you want to add to this stock?\nThis action cannot be undone.",
      async (confirm) => {
        if (!confirm) {
          return; // ❌ User clicked No
        }

        Spinner.show();

        try {
          await Consumable.addStock(selectedCID, amount, remarks);

          // Hide modals after success
          const actionModalInstance = bootstrap.Modal.getInstance(document.getElementById("actionModal"));
          const addStockModalInstance = bootstrap.Modal.getInstance(document.getElementById("addStockModal"));

          addStockModalInstance?.hide();
          actionModalInstance?.hide();

          NotificationBox.show("Items added successfully");      
          const searchTerm = document.getElementById("searchInput").value.trim();
          renderConsumableTable(searchTerm);
        } catch (err) {
          console.error("Error adding stock:", err.message);
          NotificationBox.show("Something went wrong. Please try again.");
        } finally {
          Spinner.hide();
        }
      }
    );
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
      NotificationBox.show("Failed to load users.");
      return;
    }

    assignModal.show();
  });

  // Handle Confirm Assign
  document.getElementById("confirmAssignBtn")?.addEventListener("click", () => {
    const qtyInput = document.getElementById("assignQty").value.trim();
    const assignedTo = document.getElementById("userSelect").value;
    const remarks = document.getElementById("assignRemarks").value.trim();
    const amount = parseInt(qtyInput, 10);

    if (isNaN(amount) || amount <= 0) {
      NotificationBox.show("Please enter a valid quantity.");
      return;
    }

    if (!assignedTo) {
      NotificationBox.show("Please select a user to assign to.");
      return;
    }

    // Confirmation dialog
    Confirmation.show(
      `Are you sure you want to assign ${amount} item(s) to this user?\nThis action cannot be undone.`,
      async (confirm) => {
        if (!confirm) return;

        Spinner.show();

        try {
          await Consumable.assignItem(selectedCID, amount, assignedTo, remarks);

          NotificationBox.show('Items assigned successfully');

          const searchTerm = document.getElementById("searchInput").value.trim();
          renderConsumableTable(searchTerm);
          assignModal.hide();
          actionModal.hide();
          document.getElementById("assignForm").reset();

        } catch (error) {
          console.error("Error assigning item:", error);
          NotificationBox.show(error.message || "Something went wrong.");
        } finally {
          Spinner.hide();
        }
      }
    );
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
      NotificationBox.show("Failed to generate ledger.");
    } finally {
      Spinner.hide();
    }
  });
}

function initReassignItemModal() {
  const reassignBtn = document.getElementById("reassignItemBtn");
  const reassignModal = document.getElementById("reassignModal");

  if (!reassignBtn || !reassignModal) {
    console.warn("Reassign button or modal not found in DOM.");
    return;
  }

  const modalInstance = new bootstrap.Modal(reassignModal);

  reassignBtn.addEventListener("click", async () => {
    const cid = reassignBtn.getAttribute("data-id");
    if (!cid) {
      console.warn("No CID found in data-id attribute.");
      return;
    }

    const tableBody = document.getElementById("reassignTableBody");
    tableBody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    try {
      Spinner.show();
      const { ledgerEntries } = await Ledger.fetchLedgerDataByCID(cid);
      const assignEntries = ledgerEntries.filter(entry => entry.action === "Assign Item");

      if (assignEntries.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='5'>No assigned entries found.</td></tr>";
        modalInstance.show();
        return;
      }

      const rowsHtml = assignEntries.map(entry => {
        const formattedDate = entry.dateModified?.toDate
          ? entry.dateModified.toDate().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Unknown date";

        return `
          <tr>
            <td>${formattedDate}</td>
            <td>${entry.amount}</td>
            <td>${entry.assignedTo}</td>
            <td>${entry.remarks || "—"}</td>
            <td>
              <button class="btn btn-3d btn-sm btn-outline-danger reassign-btn" data-entry-id="${entry.id}">
                Reassign Item
              </button>
            </td>
          </tr>
        `;
      }).join("");

      tableBody.innerHTML = rowsHtml;
      modalInstance.show();
    } catch (err) {
      console.error("Error loading assign items:", err);
      NotificationBox.show("Failed to load data.", "danger");
      tableBody.innerHTML = "<tr><td colspan='5'>Failed to load data.</td></tr>";
      modalInstance.show();
    } finally {
      Spinner.hide();
    }
  });

  // Handle dynamic "Reassign Item" button clicks
  document.getElementById("reassignTableBody").addEventListener("click", async (e) => {
    if (!e.target.classList.contains("reassign-btn")) return;

    const button = e.target;
    const entryId = button.getAttribute("data-entry-id");
    const cid = reassignBtn.getAttribute("data-id");

    try {
      Spinner.show();
      const { ledgerEntries } = await Ledger.fetchLedgerDataByCID(cid);
      const entry = ledgerEntries.find(e => e.id === entryId);

      if (!entry) {
        NotificationBox.show("Ledger entry not found.", "danger");
        return;
      }

      Confirmation.show(
        `Reassigning this item will restore ${entry.amount} to stock. Continue?`,
        async (confirmed) => {
          if (!confirmed) return;

          try {
            Spinner.show();
            await Consumable.addStock(cid, entry.amount, `Reassigned from ${entry.assignedTo}`);
            const searchTerm = document.getElementById("searchInput").value.trim();
            renderConsumableTable(searchTerm);
            
            button.closest("tr").remove();

            const tableBody = document.getElementById("reassignTableBody");
            if (tableBody.children.length === 0) {
              tableBody.innerHTML = "<tr><td colspan='5'>No assigned entries found.</td></tr>";
            }

            NotificationBox.show("Item reassigned successfully.", "success");
          } catch (err) {
            console.error("Error during reassignment:", err);
            NotificationBox.show("An error occurred while reassigning the item.", "danger");
          } finally {
            Spinner.hide();
          }
        }
      );
    } catch (err) {
      console.error("Failed to process reassignment:", err);
      NotificationBox.show("Failed to process reassignment.", "danger");
      Spinner.hide();
    }
  });
}

function initActionButtonHandler() {
  document.addEventListener("click", async (e) => {
    const actionBtn = e.target.closest(".action-btn");
    if (actionBtn) {
      const cid = actionBtn.getAttribute("data-id");
      const qty = actionBtn.getAttribute("data-qty");
      selectedCID = cid;

      // Assign data-id to buttons
      document.getElementById("viewLedgerBtn")?.setAttribute("data-id", cid);
      document.getElementById("reassignItemBtn")?.setAttribute("data-id", cid);
    }
  });
}


// ---------- Search ----------
function initSearchHandler() {
  document.getElementById("searchInput")?.addEventListener("input", () => {
    const rawTerm = document.getElementById("searchInput").value.trim();
    currentSearchTerm = rawTerm;

    const normalizedTerm = normalizeText(rawTerm);

    filteredItems = currentItems.filter(item =>
      normalizeText(item.specification || '').includes(normalizedTerm) ||
      normalizeText(item.id || '').includes(normalizedTerm)
    );

    localStorage.setItem("filteredConsumables", JSON.stringify(filteredItems));

    currentPage = 1;
    renderTablePage();
    renderPagination();
  });
}

function handleRefreshButton({
  buttonId,
  refreshFn,
  renderFn,
  cooldownKey,
  cooldownSeconds = 60
}) {
  if (!buttonId || !refreshFn || !renderFn || !cooldownKey) {
    console.error("handleRefreshButton: Missing required arguments.");
    return;
  }

  const refreshBtn = document.getElementById(buttonId);
  if (!refreshBtn) {
    console.error(`handleRefreshButton: Button with ID "${buttonId}" not found.`);
    return;
  }

  let originalText = refreshBtn.textContent;
  let cooldownTimer = null;

  function startCooldown() {
    const startTime = Date.now();
    const endTime = startTime + cooldownSeconds * 1000;
    localStorage.setItem(cooldownKey, startTime.toString());

    refreshBtn.disabled = true;

    cooldownTimer = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.ceil((endTime - now) / 1000);

      if (secondsLeft <= 0) {
        clearInterval(cooldownTimer);
        refreshBtn.disabled = false;
        refreshBtn.textContent = originalText;
      } else {
        refreshBtn.textContent = `Wait (${secondsLeft}s)`;
      }
    }, 1000);
  }

  // Resume countdown if cooldown still active
  const lastRefresh = parseInt(localStorage.getItem(cooldownKey)) || 0;
  const now = Date.now();
  if (now - lastRefresh < cooldownSeconds * 1000) {
    startCooldown();
  }

  refreshBtn.addEventListener("click", async () => {
    const now = Date.now();
    const lastRefresh = parseInt(localStorage.getItem(cooldownKey)) || 0;

    if (now - lastRefresh < cooldownSeconds * 1000) {
      return; // Ignore clicks during cooldown
    }

    try {
      await refreshFn();
      renderFn();
      Consumable.refreshCache();
      Ledger.refreshCache();
      const currentSearch = document.getElementById("searchInput").value.trim();
      const searchTerm = document.getElementById("searchInput").value.trim();
      renderConsumableTable(searchTerm);
      NotificationBox.show("Refreshed successfully.");
      startCooldown();
    } catch (err) {
      console.error("Refresh error:", err);
      NotificationBox.show("Failed to refresh data.");
    }
  });
}

// ---------- Table Rendering ----------
async function renderConsumableTable(searchTerm = '') {
  Spinner.show();

  try {
    currentItems = await Consumable.fetchAll();

    currentSearchTerm = searchTerm;
    const normalizedTerm = normalizeText(searchTerm);

    filteredItems = searchTerm
      ? currentItems.filter(item =>
          normalizeText(item.specification || '').includes(normalizedTerm) ||
          normalizeText(item.id || '').includes(normalizedTerm)
        )
      : [...currentItems];

    localStorage.setItem("filteredConsumables", JSON.stringify(filteredItems));
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
    const highlightedSpec = highlightMatch(item.specification || '', currentSearchTerm);
    const highlightedId = highlightMatch(item.id || '', currentSearchTerm);

    row.innerHTML = `
      <td>${highlightedId}</td>
      <td>${highlightedSpec}</td>
      <td>${item.qty}</td>
      <td>${item.unit}</td>
      <td>
        <button class="btn btn-3d btn-warning btn-sm edit-btn" 
          data-id="${item.id}" 
          data-spec="${item.specification}" 
          data-unit="${item.unit}" 
          data-bs-toggle="modal" 
          data-bs-target="#editModal">
          <i class="bi bi-pencil-square"></i>
        </button>
      </td>
      <td>
        <button class="btn btn-3d btn-secondary btn-sm action-btn" 
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

  handleEditButtons();
}

function handleEditButtons() {
  const editButtons = document.querySelectorAll(".edit-btn");

  editButtons.forEach(button => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-id");
      const spec = button.getAttribute("data-spec");
      const unit = button.getAttribute("data-unit");

      // Populate the modal fields
      document.getElementById("editCID").value = id;
      document.getElementById("editSpec").value = spec;
      document.getElementById("editUnit").value = unit;
    });
  });
}

function renderPagination() {
  const paginationContainer = document.getElementById("paginationContainer");
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  if (totalPages <= 1) return;

  const nav = document.createElement("nav");
  const ul = document.createElement("ul");
  ul.classList.add("pagination");

  // Previous Button
  const prevLi = document.createElement("li");
  prevLi.classList.add("page-item");
  if (currentPage === 1) prevLi.classList.add("disabled");

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-link");
  prevBtn.textContent = "Previous";
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTablePage();
      renderPagination();
    }
  });

  prevLi.appendChild(prevBtn);
  ul.appendChild(prevLi);

  // Calculate page range (max 5 pages at a time)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + 4;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - 4);
  }

  // Numbered Buttons
  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement("li");
    li.classList.add("page-item");
    if (i === currentPage) li.classList.add("active");

    const btn = document.createElement("button");
    btn.classList.add("page-link");
    btn.textContent = i;

    btn.addEventListener("click", () => {
      currentPage = i;
      renderTablePage();
      renderPagination();
    });

    li.appendChild(btn);
    ul.appendChild(li);
  }

  // Next Button
  const nextLi = document.createElement("li");
  nextLi.classList.add("page-item");
  if (currentPage === totalPages) nextLi.classList.add("disabled");

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-link");
  nextBtn.textContent = "Next";
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTablePage();
      renderPagination();
    }
  });

  nextLi.appendChild(nextBtn);
  ul.appendChild(nextLi);

  nav.appendChild(ul);
  paginationContainer.appendChild(nav);
}

function pageSizeSelectHandler() {
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  if (!pageSizeSelect) return;

  pageSizeSelect.addEventListener('change', () => {
    pageSize = parseInt(pageSizeSelect.value);
    currentPage = 1; // Reset to first page
    renderTablePage();
    renderPagination();
  });
}

function setupExportFilteredConsumablesToExcel() {
  const exportBtn = document.getElementById("exportBtn");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem("filteredConsumables") || "[]");

    if (data.length === 0) {
      alert("No data to export.");
      return;
    }

    const exportData = data.map(item => ({
      ID: item.id,
      Specification: item.specification,
      Quantity: item.qty,
      Unit: item.unit
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consumables");

    XLSX.writeFile(workbook, "filtered_consumables.xlsx");
  });
}




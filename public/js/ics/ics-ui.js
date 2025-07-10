import { FileService } from '../upload/upload.js';
import { ICS } from './ics-data.js';
import { Users } from '../user/user-data.js';
import { Sidebar } from '../components/sidebar.js'
import { Spinner } from '../components/spinner.js';
import { NotificationBox, Confirmation } from '../components/notification.js';

let currentPage = 1;
let rowsPerPage = 10;
let currentData = [];        // All data fetched from Firestore
let filteredData = [];       // Data after filtering
let usersMapGlobal = {};     // For use in renderFilteredTable

// 🔹 Show modal and load users
export function initializePage(){
  Sidebar.render();
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
  handleRefreshButton({
    buttonId: "refreshBtn",
    refreshFn: ICS.refreshCache.bind(ICS),
    renderFn: renderICSTable,
    cooldownKey: "lastICSRefresh",
    cooldownSeconds: 60
  });
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function highlightMatch(text, term) {
  if (!term) return text;

  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);

  const index = normalizedText.indexOf(normalizedTerm);
  if (index === -1) return text;

  // Approximate actual match range
  const regex = new RegExp(`(${term})`, "i");
  return text.replace(regex, `<mark>$1</mark>`);
}

function setupAddBtn() {
  const addBtn = document.getElementById('addBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('addICSModal'));
      modal.show();
      loadUsers();
    });
  }
}

// 🔹 Load users into dropdown
function loadUsers(selectElementId = 'assignedTo', selectedUserId = '') {
  return new Promise((resolve) => {
    const select = document.getElementById(selectElementId);
    select.innerHTML = '<option value="">Select User</option>';

    const currentUserId = localStorage.getItem('wrusUserId');

    Users.fetchAllAsc().then(users => {
      // 🔓 Admin case: populate full list
      if (currentUserId === 'admin') {
        users.forEach(user => {
          if (user.status === 'active' && user.type === 'Permanent') {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
            if (user.id === selectedUserId) {
              option.selected = true;
            }
            select.appendChild(option);
          }
        });

        select.disabled = false; // Make sure admin dropdown is enabled
      } else {
        // 🔒 Regular user: only load their own option
        const currentUser = users.find(user => user.id === currentUserId);

        if (currentUser && currentUser.status === 'active' && currentUser.type === 'Permanent') {
          const option = document.createElement('option');
          option.value = currentUser.id;
          option.textContent = `${currentUser.lastName}, ${currentUser.firstName} ${currentUser.middleInitial}.`;
          option.selected = true;
          select.appendChild(option);
        }

        select.disabled = true; // Lock dropdown for regular users
      }

      resolve(); // ✅ Done
    });
  });
}

// 🔹 Set up qty & cost listeners to auto-update total
function setupAddQtyAndCostListeners() {
  const qtyInput = document.getElementById('qty');
  const unitCostInput = document.getElementById('unitCost');

  if (qtyInput && unitCostInput) {
    qtyInput.addEventListener('input', updateAddTotalCost);
    unitCostInput.addEventListener('input', updateAddTotalCost);
  }
}

function updateAddTotalCost() {
  const qty = parseFloat(document.getElementById('qty').value) || 0;
  const unitCost = parseFloat(document.getElementById('unitCost').value) || 0;
  const total = qty * unitCost;

  document.getElementById('totalCostDisplay').textContent =
    `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function setupEditQtyAndCostListeners() {
  const qtyInput = document.getElementById('editQty');
  const unitCostInput = document.getElementById('editUnitCost');

  if (qtyInput && unitCostInput) {
    qtyInput.addEventListener('input', updateEditTotalCost);
    unitCostInput.addEventListener('input', updateEditTotalCost);
  }
}

function updateEditTotalCost() {
  const qty = parseFloat(document.getElementById('editQty').value) || 0;
  const unitCost = parseFloat(document.getElementById('editUnitCost').value) || 0;
  const total = qty * unitCost;

  document.getElementById('editTotalCostDisplay').textContent =
    `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// 🔹 File size validation (max 1MB)
function setupFileValidation() {
  const fileInput = document.getElementById('attachment');
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file && file.size > 1048576) {
        NotificationBox.show("File exceeds 1MB limit.");
        this.value = "";
      }
    });
  }
}

// 🔹 Submit handler for ICS form
function setupICSFormSubmit() {
  const addICSForm = document.getElementById('addICSForm');
  if (addICSForm) {
    addICSForm.addEventListener('submit', handleICSFormSubmit);
  }
}

async function handleICSFormSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('addICSForm');

  // Trigger Bootstrap validation UI
  form.classList.add('was-validated');

  // STOP if form is invalid
  if (!form.checkValidity()) {
    Spinner.hide();
    return;
  }

  Spinner.show();

  const fileInput = document.getElementById('attachment');
  let fileURL = null;

  try {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileURL = await FileService.uploadICSFile(file);
      if (!fileURL) throw new Error("File upload failed");
    }

    const icsData = collectICSFormData();
    if (fileURL) {
      icsData.attachmentURL = fileURL;
    }

    await ICS.add(icsData);

    form.reset();
    form.classList.remove('was-validated'); // Reset validation state
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addICSModal')).hide();
    document.getElementById('editAttachment').value = '';
    document.getElementById('attachment').value = '';

    renderICSTable();
  } catch (err) {
    console.error(err);
    NotificationBox.show("Failed to save. Please try again.");
  } finally {
    Spinner.hide();
  }
}

// 🔹 Collect ICS data from form
function collectICSFormData() {
  return {
    ICSno: document.getElementById('icsNo').value.trim(),
    serialNo: document.getElementById('serialNumber').value.trim(),
    assignedTo: document.getElementById('assignedTo').value.trim(),
    description: document.getElementById('description').value.trim(),
    qty: parseInt(document.getElementById('qty').value),
    unit: document.getElementById('unit').value.trim(),
    unitCost: parseFloat(document.getElementById('unitCost').value),
    totalCost: parseFloat(document.getElementById('totalCostDisplay').textContent.replace(/[₱,]/g, '')) || 0,
    dateIssued: document.getElementById('dateIssued').value,
    remarks: document.getElementById('remarks').value.trim(),
    status: document.getElementById('status').value,
    attachmentURL: "", // optional default
  };
}

// 🔹 Render ICS Table
async function renderICSTable(dataSet = null, page = 1, searchTerm = '') {
  Spinner.show();

  const userId = localStorage.getItem("wrusUserId");
  const tableBody = document.querySelector("#icsTableBody");
  tableBody.innerHTML = "";

  try {
    if (!dataSet) {
      const [usersMap, icsSnapshot] = await Promise.all([
        Users.getUsersMap(),
        ICS.fetchAll()
      ]);
      usersMapGlobal = usersMap;
      currentData = icsSnapshot;
    }

    let dataToUse = dataSet || currentData;
    const usersMap = usersMapGlobal;

    if (userId !== "admin") {
      dataToUse = dataToUse.filter(entry => entry.data.assignedTo === userId);
    }

    if (dataToUse.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='6'>No ICS entries found.</td></tr>";
      return;
    }

    currentPage = page;
    const startIndex = (page - 1) * rowsPerPage;
    const paginatedItems = dataToUse.slice(startIndex, startIndex + rowsPerPage);

    const rowsHtml = paginatedItems.map(entry => {
      const { ICSno, description, dateIssued, assignedTo, attachmentURL, totalCost } = entry.data;
      const assignedName = usersMap[assignedTo] || "Unknown User";

      const formattedCost = typeof totalCost === 'number'
        ? `₱${totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '₱0.00';

      return `
        <tr>
          <td>${highlightMatch(ICSno || '(no ICSno)', searchTerm)}</td>
          <td>${highlightMatch(assignedName, searchTerm)}</td>
          <td>${highlightMatch(description || '', searchTerm)}</td>
          <td>${highlightMatch(dateIssued || '', searchTerm)}</td>
          <td>${formattedCost}</td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-primary flex-fill d-flex align-items-center justify-content-center" data-id="${entry.id}">
                <i class="bi bi-pencil-square"></i>
              </button>
              <a href="${attachmentURL || '#'}" target="_blank"
                class="btn btn-sm btn-secondary flex-fill d-flex align-items-center justify-content-center"
                data-id="${entry.id}">
                <i class="bi bi-eye"></i>
              </a>
            </div>
          </td>
        </tr>`;
    }).join("");

    tableBody.innerHTML = rowsHtml;

    document.querySelectorAll(".btn-primary[data-id]").forEach(button => {
      button.addEventListener("click", () => {
        const docId = button.getAttribute("data-id");
        const icsItem = currentData.find(item => item.id === docId);
        if (icsItem) {
          populateEditModal(icsItem);
          new bootstrap.Modal(document.getElementById('editICSModal')).show();
        }
      });
    });

    renderPaginationControls(dataToUse, page);

  } catch (err) {
    console.error("Error rendering ICS table:", err);
    tableBody.innerHTML = "<tr><td colspan='6'>Error loading data.</td></tr>";
  } finally {
    Spinner.hide();
  }
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

  const originalText = refreshBtn.textContent;
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

  // Resume countdown if cooldown is still active
  const lastRefresh = parseInt(localStorage.getItem(cooldownKey)) || 0;
  const now = Date.now();
  if (now - lastRefresh < cooldownSeconds * 1000) {
    startCooldown();
  }

  refreshBtn.addEventListener("click", async () => {
    const now = Date.now();
    const lastRefresh = parseInt(localStorage.getItem(cooldownKey)) || 0;

    if (now - lastRefresh < cooldownSeconds * 1000) {
      return;
    }

    try {
      await refreshFn();
      renderFn();
      ICS.refreshCache();
      renderICSTable();
      NotificationBox.show("Refreshed successfully.");
      startCooldown();
    } catch (err) {
      console.error("Refresh error:", err);
      NotificationBox.show("Failed to refresh data.");
    }
  });
}

function renderPaginationControls(dataSet, page) {
  const totalPages = Math.ceil(dataSet.length / rowsPerPage);
  const pagination = document.getElementById("paginationControlsICS");
  pagination.innerHTML = "";

  // Calculate page range (max 5 pages at a time)
  const maxVisiblePages = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Previous Button
  const prevItem = document.createElement("li");
  prevItem.className = `page-item ${page === 1 ? "disabled" : ""}`;
  prevItem.innerHTML = `<a class="page-link" href="#">Previous</a>`;
  prevItem.addEventListener("click", (e) => {
    e.preventDefault();
    if (page > 1) {
      renderICSTable(null, page - 1);
    }
  });
  pagination.appendChild(prevItem);

  // Page Numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageItem = document.createElement("li");
    pageItem.className = `page-item ${i === page ? "active" : ""}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageItem.addEventListener("click", (e) => {
      e.preventDefault();
      renderICSTable(null, i);
    });
    pagination.appendChild(pageItem);
  }

  // Next Button
  const nextItem = document.createElement("li");
  nextItem.className = `page-item ${page === totalPages ? "disabled" : ""}`;
  nextItem.innerHTML = `<a class="page-link" href="#">Next</a>`;
  nextItem.addEventListener("click", (e) => {
    e.preventDefault();
    if (page < totalPages) {
      renderICSTable(null, page + 1);
    }
  });
  pagination.appendChild(nextItem);
}

function applySearchFilter() {
  const rawQuery = document.getElementById("searchBar").value.trim();
  const query = normalizeText(rawQuery);

  filteredData = currentData.filter(entry => {
    const { ICSno, assignedTo, dateIssued, description } = entry.data;
    const assignedName = usersMapGlobal[assignedTo] || "Unknown User";

    return (
      normalizeText(ICSno || '').includes(query) ||
      normalizeText(assignedName).includes(query) ||
      normalizeText(dateIssued || '').includes(query) ||
      normalizeText(description || '').includes(query)
    );
  });

  renderICSTable(filteredData, 1, rawQuery);
}

async function populateEditModal(icsItem) {
  const data = icsItem.data;
  
  document.getElementById("editDocId").value = icsItem.id;
  document.getElementById('editIcsNo').value = data.ICSno || '';
  document.getElementById('editSerialNumber').value = data.serialNo || '';
  document.getElementById('editDescription').value = data.description || '';
  document.getElementById('editQty').value = data.qty || '';
  document.getElementById('editUnit').value = data.unit || '';
  document.getElementById('editUnitCost').value = data.unitCost || '';
  document.getElementById('editRemarks').value = data.remarks || '';
  document.getElementById('editDateIssued').value = data.dateIssued || '';
  document.getElementById('editStatus').value = data.status || '';
  document.getElementById('editCurrentAttachmentUrl').value = data.attachmentURL || ''; '';

  // Compute and show total cost
  const total = (data.qty || 0) * (data.unitCost || 0);
  document.getElementById('editTotalCostDisplay').textContent = 
    `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Populate the dropdown and pre-select user
  await loadUsers('editAssignedTo', data.assignedTo);
}

function setupEditICSFormSubmit() {
  const editICSForm = document.getElementById('editICSForm');
  if (editICSForm) {
    editICSForm.addEventListener('submit', handleEditICSSubmit);
  }
}

async function handleEditICSSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('editICSForm');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  Spinner.show();

  const docId = document.getElementById('editDocId').value;
  if (!docId) {
    NotificationBox.showt("Document ID missing. Please reload and try again.");
    Spinner.hide();
    return;
  }

  const fileInput = document.getElementById('editAttachment');
  const newFile = fileInput.files[0];
  let attachmentURL = document.getElementById('editCurrentAttachmentUrl').value;

  if (newFile) {
    if (attachmentURL) {
      const deleted = await FileService.deleteFileFromStorage(attachmentURL);
      if (!deleted) {
        console.warn("Old file may not have been deleted properly.");
      }
    }

    const uploadedUrl = await FileService.uploadICSFile(newFile);
    if (!uploadedUrl) {
      NotificationBox.show('New file upload failed.');
      Spinner.hide();
      return;
    }
    attachmentURL = uploadedUrl;
  }

  const updatedData = {
    ICSno: document.getElementById('editIcsNo').value.trim(),
    serialNo: document.getElementById('editSerialNumber').value.trim(),
    assignedTo: document.getElementById('editAssignedTo').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
    qty: parseInt(document.getElementById('editQty').value),
    unit: document.getElementById('editUnit').value.trim(),
    unitCost: parseFloat(document.getElementById('editUnitCost').value),
    totalCost: parseFloat(document.getElementById('editTotalCostDisplay').textContent.replace(/[₱,]/g, '')) || 0,
    dateIssued: document.getElementById('editDateIssued').value,
    remarks: document.getElementById('editRemarks').value.trim(),
    status: document.getElementById('editStatus').value,
    attachmentURL
  };

  try {
    NotificationBox.show('ICS entry update successful');
    await ICS.update(docId, updatedData);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editICSModal')).hide();
    document.getElementById('editAttachment').value = '';
    document.getElementById('attachment').value = '';
    renderICSTable(null, currentPage);
  } catch (err) {
    console.error("❌ Failed to update ICS entry:", err);
    NotificationBox.show("Update failed. Check console for details.");
  } finally {
    Spinner.hide();
    form.classList.remove('was-validated');
  }
}

function initDeleteICSButton() {
  const deleteButton = document.getElementById("deleteICSButton");

  if (!deleteButton) {
    console.warn("Delete button not found in DOM.");
    return;
  }

  deleteButton.addEventListener("click", () => {
    const docId = document.getElementById("editDocId")?.value;
    const attachmentURL = document.getElementById("editCurrentAttachmentUrl")?.value;

    if (!docId) {
      console.error("No docId found for deletion.");
      return;
    }

    Confirmation.show(
      "Are you sure you want to delete this ICS entry?\nThis action is irreversible.",
      async (confirmed) => {
        if (!confirmed) return;

        Spinner.show();
        try {
          // Delete attachment if exists
          if (attachmentURL) {
            const deleted = await FileService.deleteFileFromStorage(attachmentURL);
            if (!deleted) {
              console.warn("Attachment might not have been deleted.");
            }
          }

          // Delete ICS document
          await ICS.delete(docId);

          NotificationBox.show("ICS entry deleted successfully");
          bootstrap.Modal.getInstance(document.getElementById("editICSModal"))?.hide();
          await renderICSTable();
        } catch (error) {
          console.error("Failed to delete ICS entry:", error);
          NotificationBox.show("Failed to delete ICS entry.");
        } finally {
          Spinner.hide();
        }
      }
    );
  });
}

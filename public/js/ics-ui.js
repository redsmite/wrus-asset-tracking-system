import { uploadFileAndGetURL, deleteFileFromStorage } from './upload/upload.js';
import {
  getUsers,
  addICSEntry,
  getUsersMap,
  getICSListWithDocIds,
  updateICSEntry
} from './ics-data.js';
import { renderSidebar } from './components/sidebar.js';
import { renderAdminSidebar } from './admin/admin-sidebar.js';
import { renderSpinner, showSpinner, hideSpinner } from './components/spinner.js';

let currentPage = 1;
let rowsPerPage = 10;
let currentData = [];        // All data fetched from Firestore
let filteredData = [];       // Data after filtering
let usersMapGlobal = {};     // For use in renderFilteredTable

document.addEventListener('DOMContentLoaded', () => {

  const userRole = localStorage.getItem('userRole');
  const userType = localStorage.getItem("userType");

  if (userRole === 'admin'){
    renderAdminSidebar();
  } else {
    renderSidebar();
  }

  
  if (userType !== "Permanent" && userRole !== 'admin') {

  const pageContent = document.getElementById("page-content");
    if (pageContent) {
      pageContent.innerHTML = "<p class='text-danger'>Access denied.</p>";
    }

  } else {

  
    renderSpinner();
    setupLogoutButtons();
    setupAddBtn();
    setupAddQtyAndCostListeners();
    setupEditQtyAndCostListeners();
    setupFileValidation();
    setupICSFormSubmit();
    renderICSTable();
    document.getElementById("searchBar").addEventListener("input", applySearchFilter);
    setupEditICSFormSubmit();
  }
});

// 🔹 Logout button setup
function setupLogoutButtons() {
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutBtnMobile = document.getElementById("logoutBtnMobile");

  [logoutBtn, logoutBtnMobile].forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("userFullName");
        window.location.href = "index.html";
      });
    }
  });
}

// 🔹 Show modal and load users
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

    getUsers().then(users => {
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
        alert("File exceeds 1MB limit.");
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
    hideSpinner(); // in case spinner was triggered elsewhere
    return;
  }

  showSpinner();

  const fileInput = document.getElementById('attachment');
  let fileURL = null;

  try {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileURL = await uploadFileAndGetURL(file);
      if (!fileURL) throw new Error("File upload failed");
    }

    const icsData = collectICSFormData();
    if (fileURL) {
      icsData.attachmentURL = fileURL;
    }

    await addICSEntry(icsData);

    form.reset();
    form.classList.remove('was-validated'); // Reset validation state
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addICSModal')).hide();
    document.getElementById('editAttachment').value = '';
    document.getElementById('attachment').value = '';

    renderICSTable();
  } catch (err) {
    console.error(err);
    alert("Failed to save. Please try again.");
  } finally {
    hideSpinner();
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
async function renderICSTable(dataSet = null, page = 1) {
  showSpinner();

  const userId = localStorage.getItem("wrusUserId");
  const tableBody = document.querySelector("#icsTableBody");
  tableBody.innerHTML = "";

  try {
    if (!dataSet) {
      const [usersMap, icsSnapshot] = await Promise.all([
        getUsersMap(),
        getICSListWithDocIds()
      ]);
      usersMapGlobal = usersMap;
      currentData = icsSnapshot;
    }

    let dataToUse = dataSet || currentData;
    const usersMap = usersMapGlobal;

    // 🚫 Filter based on user role
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
          <td>${ICSno || '(no ICSno)'}</td>
          <td>${assignedName}</td>
          <td>${description || ''}</td>
          <td>${dateIssued || ''}</td>
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
    hideSpinner();
  }
}


function renderPaginationControls(dataSet, currentPage) {
  const pagination = document.getElementById("paginationControls");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(dataSet.length / rowsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm mx-1 ${i === currentPage ? "btn-primary" : "btn-outline-primary"}`;
    btn.textContent = i;
    btn.addEventListener("click", () => {
      renderICSTable(dataSet, i);
    });
    pagination.appendChild(btn);
  }
}

function applySearchFilter() {
  const query = document.getElementById("searchBar").value.trim().toLowerCase();

  filteredData = currentData.filter(entry => {
    const { ICSno, assignedTo, dateIssued, description } = entry.data;

    const assignedName = usersMapGlobal[assignedTo] || "Unknown User";

    return (
      (ICSno || '').toLowerCase().includes(query) ||
      assignedName.toLowerCase().includes(query) ||
      (dateIssued || '').toLowerCase().includes(query) ||
      (description || '').toLowerCase().includes(query)
    );
  });

  renderICSTable(filteredData, 1);
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

  showSpinner();

  const docId = document.getElementById('editDocId').value;
  if (!docId) {
    alert("Document ID missing. Please reload and try again.");
    hideSpinner();
    return;
  }

  const fileInput = document.getElementById('editAttachment');
  const newFile = fileInput.files[0];
  let attachmentURL = document.getElementById('editCurrentAttachmentUrl').value;

  if (newFile) {
    if (attachmentURL) {
      const deleted = await deleteFileFromStorage(attachmentURL);
      if (!deleted) {
        console.warn("Old file may not have been deleted properly.");
      }
    }

    const uploadedUrl = await uploadFileAndGetURL(newFile);
    if (!uploadedUrl) {
      alert('New file upload failed.');
      hideSpinner();
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
    await updateICSEntry(docId, updatedData);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('editICSModal')).hide();
    document.getElementById('editAttachment').value = '';
    document.getElementById('attachment').value = '';
    renderICSTable(null, currentPage);
  } catch (err) {
    console.error("❌ Failed to update ICS entry:", err);
    alert("Update failed. Check console for details.");
  } finally {
    hideSpinner();
    form.classList.remove('was-validated');
  }
}
import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { Permit } from "./permit-data.js";
import { FileService } from "../upload/upload.js";
import { CoordinateUtils } from "../utils/coordinates.js";
import { NotificationBox } from "../components/notification.js";

export function initializePage(){
  Sidebar.render();
  Spinner.render();
  handleAddButton();
  handleAddFormSubmit();
  loadPermit();
  setupToggle('toggleFilter', 'filterSection', 'Show Filters', 'Hide Filters');
  initializePermitUpdate();
  handleRefreshButton();
}

function handleAddButton(){
  document.getElementById('addPermitBtn').addEventListener('click', () => {
    const permitModal = new bootstrap.Modal(document.getElementById('addPermitModal'));
    permitModal.show();
  });
}

function handleAddFormSubmit() {
  document.getElementById('savePermitBtn').addEventListener('click', async () => {
    Spinner.show();

    const form = document.getElementById('permitForm');

    // Form validation
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      Spinner.hide();
      return;
    }

    const visited = document.getElementById('visited').checked;
    const pdfFile = document.getElementById('pdfAttachment').files[0];

    let pdfUrl = null;

    // Upload PDF if present
    if (pdfFile) {
      pdfUrl = await FileService.uploadPermitFile(pdfFile);
      if (!pdfUrl) {
        Spinner.hide();
        return;
      }
    }

    // 🌐 Convert Latitude DMS to Decimal
    const latDegrees = parseFloat(document.getElementById('latDegrees').value) || 0;
    const latMinutes = parseFloat(document.getElementById('latMinutes').value) || 0;
    const latSeconds = parseFloat(document.getElementById('latSeconds').value) || 0;
    const latDirection = document.getElementById('latDirection').value;

    const latitude = CoordinateUtils.dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection);

    // 🌐 Convert Longitude DMS to Decimal
    const lonDegrees = parseFloat(document.getElementById('lonDegrees').value) || 0;
    const lonMinutes = parseFloat(document.getElementById('lonMinutes').value) || 0;
    const lonSeconds = parseFloat(document.getElementById('lonSeconds').value) || 0;
    const lonDirection = document.getElementById('lonDirection').value;

    const longitude = CoordinateUtils.dmsToDecimal(lonDegrees, lonMinutes, lonSeconds, lonDirection);

    const data = {
      permitNo: document.getElementById('permitNo').value.trim(),
      permittee: document.getElementById('permittee').value.trim(),
      mailingAddress: document.getElementById('mailingAddress').value.trim(),
      diversionPoint: document.getElementById('diversionPoint').value.trim(),
      latitude: latitude, // Decimal latitude
      longitude: longitude, // Decimal longitude
      waterSource: document.getElementById('waterSource').value.trim(),
      waterDiversion: document.getElementById('waterDiversion').value.trim(),
      flowRate: parseFloat(document.getElementById('flowRate').value) || 0,
      purpose: document.getElementById('purpose').value.trim(),
      periodOfUse: document.getElementById('periodOfUse').value.trim(),
      visited: visited,
      pdfUrl: pdfUrl || '',
      encodedBy: localStorage.getItem("wrusUserId") || null,
      timestamp: new Date()
    };

    try {
      await Permit.add(data);
      renderPermitTable();
      NotificationBox.show('Permit successfully added');

      // Reset form
      form.reset();
      form.classList.remove('was-validated');
      const modal = bootstrap.Modal.getInstance(document.getElementById('addPermitModal'));
      modal.hide();
    } catch (error) {
      NotificationBox.show(`❌ Error: ${error.message}`);
      console.error('Error:', error);
    } finally {
      Spinner.hide();
    }
  });
}

function setupToggle(buttonId, sectionId, labelShow, labelHide) {
  const button = document.getElementById(buttonId);
  const section = document.getElementById(sectionId);

  if (!button || !section) {
    console.error(`setupToggle error: Check IDs "${buttonId}" or "${sectionId}" — one or both not found.`);
    return;
  }

  // Initialize button label based on current visibility
  const isInitiallyHidden = section.style.display === 'none' || getComputedStyle(section).display === 'none';

  button.innerHTML = isInitiallyHidden
    ? `<i class="bi bi-eye"></i> ${labelShow}`
    : `<i class="bi bi-eye-slash"></i> ${labelHide}`;

  // Add toggle event
  button.addEventListener('click', () => {
    const isHidden = section.style.display === 'none' || getComputedStyle(section).display === 'none';

    section.style.display = isHidden ? 'block' : 'none';
    button.innerHTML = isHidden
      ? `<i class="bi bi-eye-slash"></i> ${labelHide}`
      : `<i class="bi bi-eye"></i> ${labelShow}`;
  });
}

async function renderPermitTable() {
  const tableBody = document.getElementById('permitTableBody');
  const searchBar = document.getElementById('searchBar');
  const visitedFilter = document.getElementById('visitedFilter');
  const showVisitedFilter = document.getElementById('showVisitedFilter');
  const pagination = document.getElementById('pagination');
  const rowsPerPageSelect = document.getElementById('rowsPerPage');

  function normalizeText(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;

    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchTerm);

    const startIndex = normalizedText.indexOf(normalizedSearch);
    if (startIndex === -1) return text;

    const endIndex = startIndex + searchTerm.length;

    return (
      text.slice(0, startIndex) +
      '<mark>' + text.slice(startIndex, endIndex) + '</mark>' +
      text.slice(endIndex)
    );
  }

  let rowsPerPage = parseInt(rowsPerPageSelect.value);
  let currentPage = 1;
  let filteredPermits = [];
  let searchTerm = '';

  tableBody.innerHTML = '';
  pagination.innerHTML = '';

  try {
    const permits = await Permit.getAll();

    function renderRows(data) {
      tableBody.innerHTML = '';

      if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No data found</td></tr>`;
        return;
      }

      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const paginatedItems = data.slice(start, end);

      paginatedItems.forEach((permit) => {
        const latitude = permit.latitude ? Number(permit.latitude).toFixed(5) : '';
        const longitude = permit.longitude ? Number(permit.longitude).toFixed(5) : '';
        const isVisited = permit.visited === true;
        const rowClass = isVisited ? 'table-water-highlight' : '';

        const row = document.createElement('tr');
        row.className = rowClass;

        row.innerHTML = `
          <td>${highlightMatch(permit.permitNo || '', searchTerm)}</td>
          <td>${highlightMatch(permit.permittee || '', searchTerm)}</td>
          <td>${highlightMatch(permit.mailingAddress || '', searchTerm)}</td>
          <td>${highlightMatch(permit.diversionPoint || '', searchTerm)}</td>
          <td>${latitude}</td>
          <td>${longitude}</td>
          <td>${permit.waterSource || ''}</td>
          <td>${permit.purpose || ''}</td>
          <td>
            <button class="btn btn-sm btn-warning" data-id="${permit.id}">
              <i class="bi bi-pencil-square"></i>
            </button>
            <a href="${permit.pdfUrl}" target="_blank" class="btn btn-sm btn-info">
              <i class="bi bi-eye-fill"></i>
            </a>
          </td>
        `;

        tableBody.appendChild(row);

        const editButton = row.querySelector('button[data-id]');
        editButton.addEventListener('click', () => {
          const permitId = editButton.getAttribute('data-id');
          const permitData = permits.find((p) => p.id === permitId);
          if (permitData) {
            populateEditModal(permitData);
            const editModal = new bootstrap.Modal(document.getElementById('editPermitModal'));
            editModal.show();
          }
        });
      });
    }

    function renderPagination(totalItems) {
      pagination.innerHTML = '';
      const totalPages = Math.ceil(totalItems / rowsPerPage);

      if (totalPages <= 1) return;

      const createButton = (label, page, disabled = false, active = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
        const btn = document.createElement('button');
        btn.className = 'page-link';
        btn.innerText = label;
        btn.addEventListener('click', () => {
          if (!disabled) {
            currentPage = page;
            renderRows(filteredPermits);
            renderPagination(filteredPermits.length);
          }
        });
        li.appendChild(btn);
        return li;
      };

      const maxPageButtons = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
      let endPage = startPage + maxPageButtons - 1;

      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPageButtons + 1);
      }

      pagination.appendChild(createButton('«', currentPage - 1, currentPage === 1));
      for (let i = startPage; i <= endPage; i++) {
        pagination.appendChild(createButton(i, i, false, currentPage === i));
      }
      pagination.appendChild(createButton('»', currentPage + 1, currentPage === totalPages));
    }

    function applyFilters() {
      searchTerm = normalizeText(searchBar.value.trim());

      const isVisitedChecked = visitedFilter.checked;
      const isShowVisitedChecked = showVisitedFilter.checked;

      filteredPermits = permits.filter((permit) => {
        const matchesSearch =
          (permit.permitNo && normalizeText(permit.permitNo).includes(searchTerm)) ||
          (permit.permittee && normalizeText(permit.permittee).includes(searchTerm)) ||
          (permit.mailingAddress && normalizeText(permit.mailingAddress).includes(searchTerm)) ||
          (permit.diversionPoint && normalizeText(permit.diversionPoint).includes(searchTerm));

        let matchesVisited = true;
        if (isVisitedChecked && !isShowVisitedChecked) {
          matchesVisited = permit.visited === false;
        } else if (!isVisitedChecked && isShowVisitedChecked) {
          matchesVisited = permit.visited === true;
        } else if (isVisitedChecked && isShowVisitedChecked) {
          matchesVisited = false;
        }

        return matchesSearch && matchesVisited;
      });

      currentPage = 1;
      renderRows(filteredPermits);
      renderPagination(filteredPermits.length);
    }

    rowsPerPageSelect.addEventListener('change', () => {
      rowsPerPage = parseInt(rowsPerPageSelect.value);
      currentPage = 1;
      renderRows(filteredPermits);
      renderPagination(filteredPermits.length);
    });

    searchBar.addEventListener('input', applyFilters);

    visitedFilter.addEventListener('change', () => {
      showVisitedFilter.disabled = visitedFilter.checked;
      applyFilters();
    });

    showVisitedFilter.addEventListener('change', () => {
      visitedFilter.disabled = showVisitedFilter.checked;
      applyFilters();
    });

    applyFilters();

  } catch (error) {
    console.error('❌ Error rendering permit table:', error.message);
    tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading data</td></tr>`;
  }
}

function handleRefreshButton(){
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', ()=>{
      renderPermitTable();
      NotificationBox.show("Refreshed successfully.");
    })
}

async function loadPermit(){
  Spinner.show();
  try{
    await renderPermitTable();
  } finally {
    Spinner.hide();
  }
}

function populateEditModal(permit) {
  document.getElementById('editPermitForm').setAttribute('data-id', permit.id);
  // Basic Info
  document.getElementById('editPermitNo').value = permit.permitNo || '';
  document.getElementById('editPermittee').value = permit.permittee || '';
  document.getElementById('editMailingAddress').value = permit.mailingAddress || '';
  document.getElementById('editDiversionPoint').value = permit.diversionPoint || '';

  // Parse Latitude (Decimal to DMS)
  if (permit.latitude) {
    const { degrees, minutes, seconds, direction } = CoordinateUtils.decimalToDMS(permit.latitude, 'lat');
    document.getElementById('editLatDegrees').value = degrees;
    document.getElementById('editLatMinutes').value = minutes;
    document.getElementById('editLatSeconds').value = seconds;
  }

  // Parse Longitude (Decimal to DMS)
  if (permit.longitude) {
    const { degrees, minutes, seconds, direction } = CoordinateUtils.decimalToDMS(permit.longitude, 'lon');
    document.getElementById('editLonDegrees').value = degrees;
    document.getElementById('editLonMinutes').value = minutes;
    document.getElementById('editLonSeconds').value = seconds;
  }

  // Technical Info
  document.getElementById('editWaterSource').value = permit.waterSource || '';
  document.getElementById('editWaterDiversion').value = permit.waterDiversion || '';
  document.getElementById('editFlowRate').value = permit.flowRate || '';
  document.getElementById('editPeriodOfUse').value = permit.periodOfUse || '';
  document.getElementById('editPurpose').value = permit.purpose || '';
  document.getElementById('editVisited').checked = !!permit.visited;
  document.getElementById('editPdfExistingUrl').value = permit.pdfUrl || '';
}

function initializePermitUpdate() {
  const updateBtn = document.getElementById('updatePermitBtn');
  if (!updateBtn) {
    console.error('Update button not found.');
    return;
  }

  updateBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    Spinner.show();

    try {
      const form = document.getElementById('editPermitForm');
      if (!form) {
        console.error('Edit form not found.');
        return;
      }

      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      const id = form.getAttribute('data-id');
      if (!id) {
        console.error('No document ID found for update.');
        return;
      }

      // 👉 Handle Coordinates
      const latDegrees = parseFloat(document.getElementById('editLatDegrees').value) || 0;
      const latMinutes = parseFloat(document.getElementById('editLatMinutes').value) || 0;
      const latSeconds = parseFloat(document.getElementById('editLatSeconds').value) || 0;
      const latDirection = document.getElementById('editLatDirection').value.trim();

      const lonDegrees = parseFloat(document.getElementById('editLonDegrees').value) || 0;
      const lonMinutes = parseFloat(document.getElementById('editLonMinutes').value) || 0;
      const lonSeconds = parseFloat(document.getElementById('editLonSeconds').value) || 0;
      const lonDirection = document.getElementById('editLonDirection').value.trim();

      const latitudeDecimal = CoordinateUtils.dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection);
      const longitudeDecimal = CoordinateUtils.dmsToDecimal(lonDegrees, lonMinutes, lonSeconds, lonDirection);

      // 📄 Handle PDF Upload
      const fileInput = document.getElementById('editPdfAttachment');
      let permitFileUrl = document.getElementById('editPdfExistingUrl').value || '';

      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];

        // 🗑️ Delete existing file before uploading a new one
        if (permitFileUrl) {
          const deleted = await FileService.deleteFileFromPermitBucket(permitFileUrl);
          if (!deleted) {
            throw new Error('Failed to delete existing PDF before uploading new one.');
          }
        }

        // ✅ Upload the new file
        const uploadedUrl = await FileService.uploadPermitFile(file);

        if (uploadedUrl) {
          permitFileUrl = uploadedUrl;
        } else {
          throw new Error('Failed to upload permit file.');
        }
      }

      // 🔥 Prepare data for update
      const data = {
        permitNo: document.getElementById('editPermitNo').value.trim(),
        permittee: document.getElementById('editPermittee').value.trim(),
        mailingAddress: document.getElementById('editMailingAddress').value.trim(),
        diversionPoint: document.getElementById('editDiversionPoint').value.trim(),

        latitude: latitudeDecimal,
        longitude: longitudeDecimal,

        waterSource: document.getElementById('editWaterSource').value.trim(),
        waterDiversion: document.getElementById('editWaterDiversion').value.trim(),
        flowRate: parseFloat(document.getElementById('editFlowRate').value) || 0,
        periodOfUse: document.getElementById('editPeriodOfUse').value.trim(),
        purpose: document.getElementById('editPurpose').value.trim(),
        visited: document.getElementById('editVisited').checked,

        pdfUrl: permitFileUrl
      };

      // 🚀 Update Firestore
      await Permit.update(id, data);
      renderPermitTable();
      NotificationBox.show('Permit updated successfully');

      const editModal = bootstrap.Modal.getInstance(document.getElementById('editPermitModal'));
      if (editModal) editModal.hide();

      form.classList.remove('was-validated');

    } catch (error) {
      console.error(' Error updating permit:', error);
      NotificationBox.show('Failed to update permit. Please try again.');
    } finally {
      Spinner.hide();
    }
  });
}









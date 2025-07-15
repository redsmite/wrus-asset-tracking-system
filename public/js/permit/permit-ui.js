import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { Permit } from "./permit-data.js";
import { FileService } from "../upload/upload.js";
import { GeotaggedFileService } from "../upload/uploadImg.js";
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
  setupExportButtonListener();
  setupImageUploadModal();
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
    const cancelled = document.getElementById('isCancelled').checked;
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
      cancelled: cancelled,
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
    const permits = await Permit.getAll(); // <-- Your Firestore data fetching here

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
        let rowClass = '';
        if (permit.cancelled === true) rowClass += ' table-water-cancelled';
        if (permit.visited === true) rowClass += ' table-water-highlight';

        const row = document.createElement('tr');
        row.className = rowClass;

        row.innerHTML = `
          <td>${highlightMatch(permit.permitNo || '', searchTerm)}</td>
          <td>${highlightMatch(permit.permittee || '', searchTerm)}</td>
          <td>${highlightMatch(permit.mailingAddress || '')}</td>
          <td>${highlightMatch(permit.diversionPoint || '', searchTerm)}</td>
          <td>${latitude}</td>
          <td>${longitude}</td>
          <td>${permit.waterSource || ''}</td>
          <td>${permit.purpose || ''}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-sm btn-warning edit-btn" data-id="${permit.id}">
                <i class="bi bi-pencil-square"></i>
              </button>
              <a href="${permit.pdfUrl}" target="_blank" class="btn btn-sm btn-info">
                <i class="bi bi-eye-fill"></i>
              </a>
              <button class="btn btn-sm ${isVisited ? 'btn-secondary' : 'btn-success'} visit-btn" data-id="${permit.id}">
                <i class="bi ${isVisited ? 'bi-check-circle-fill' : 'bi-geo-alt-fill'}"></i>
              </button>
            </div>
          </td>
        `;

        tableBody.appendChild(row);

        const editButton = row.querySelector('.edit-btn');
        const visitButton = row.querySelector('.visit-btn');

        editButton.addEventListener('click', () => {
          const permitId = editButton.getAttribute('data-id');
          const permitData = permits.find((p) => p.id === permitId);
          if (permitData) {
            populateEditModal(permitData);
            const editModal = new bootstrap.Modal(document.getElementById('editPermitModal'));
            editModal.show();
          }
        });

        visitButton.addEventListener('click', async () => {
          const imageModalEl = document.getElementById('imageUploadModal');
          const imageModal = new bootstrap.Modal(imageModalEl);
          const imagePreview = document.getElementById('imagePreview');
          const permitId = visitButton.getAttribute('data-id');
          const placeholderURL = './images/placeholder.png';

          let imageUrl = placeholderURL;

          try {
            const doc = await Permit.getById(permitId); // 
            if (doc?.geotaggedUrl) {
              imageUrl = doc.geotaggedUrl;
            }
          } catch (error) {
            console.error('Error loading permit or image:', error);
          }

          setupImageUploadModal(permitId, imageUrl);

          // Show the modal
          imageModal.show();
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

      // Store filtered results for export
      localStorage.setItem('cachedPermitsExcel', JSON.stringify(filteredPermits));
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

    applyFilters(); // Initial filter and render

  } catch (error) {
    console.error('Error rendering permit table:', error.message);
    tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading data</td></tr>`;
  }
}

function handleRefreshButton() {
  const refreshBtn = document.getElementById('refreshBtn');
  const COOLDOWN_SECONDS = 60;
  const LAST_REFRESH_KEY = 'lastPermitRefresh';

  function getRemainingCooldown() {
    const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
    if (!lastRefresh) return 0;
    const elapsed = (Date.now() - parseInt(lastRefresh, 10)) / 1000;
    return Math.max(0, COOLDOWN_SECONDS - Math.floor(elapsed));
  }

  function startCooldown() {
    localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString());
    let remaining = COOLDOWN_SECONDS;
    refreshBtn.disabled = true;
    const originalText = "🔁 Refresh";

    const interval = setInterval(() => {
      remaining--;
      refreshBtn.innerText = `Wait ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(interval);
        refreshBtn.disabled = false;
        refreshBtn.innerText = originalText;
      }
    }, 1000);
  }

  // On load, check if cooldown is active
  const remainingCooldown = getRemainingCooldown();
  if (remainingCooldown > 0) {
    refreshBtn.disabled = true;
    refreshBtn.innerText = `Wait ${remainingCooldown}s`;

    let remaining = remainingCooldown;
    const interval = setInterval(() => {
      remaining--;
      refreshBtn.innerText = `Wait ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(interval);
        refreshBtn.disabled = false;
        refreshBtn.innerText = "🔁 Refresh";
      }
    }, 1000);
  }

  refreshBtn.addEventListener('click', async () => {
    const remaining = getRemainingCooldown();
    if (remaining > 0) {
      NotificationBox.show(`Please wait ${remaining}s before refreshing again.`);
      return;
    }

    try {
      refreshBtn.disabled = true;
      refreshBtn.innerText = "Refreshing...";
      await Permit.refreshCache();
      renderPermitTable();
      NotificationBox.show("Refreshed successfully.");
      startCooldown();
    } catch (err) {
      refreshBtn.disabled = false;
      refreshBtn.innerText = "🔁 Refresh";
      console.error(err);
      NotificationBox.show("Error during refresh.");
    }
  });
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
  document.getElementById('editIsCancelled').checked = !!permit.cancelled;
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
        cancelled: document.getElementById('editIsCancelled').checked,

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

function setupExportButtonListener() {
  const exportBtn = document.getElementById('exportPermitsBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const data = JSON.parse(localStorage.getItem('cachedPermitsExcel')) || [];
    if (!data || data.length === 0) return;

    const formattedData = data.map(item => {
      const {
        permitNo,
        permittee,
        mailingAddress,
        diversionPoint,
        latitude,
        longitude,
        waterSource,
        waterDiversion,
        flowRate,
        purpose,
        periodOfUse,
        visited,
        cancelled
      } = item;

      return {
        "Permit No": permitNo || '',
        "Permittee": permittee || '',
        "Mailing Address": mailingAddress || '',
        "Diversion Point": diversionPoint || '',
        "Latitude": latitude || '',
        "Longitude": longitude || '',
        "Water Source": waterSource || '',
        "Water Diversion": waterDiversion || '',
        "Flow Rate": flowRate || '',
        "Purpose": purpose || '',
        "Period of Use": periodOfUse || '',
        __visited: visited === true,
        __cancelled: cancelled === true
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      skipHeader: false
    });

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = 1; R <= range.e.r; ++R) {
      const visited = formattedData[R - 1]?.__visited;
      if (visited) {
        for (let C = 0; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            fill: { fgColor: { rgb: "DFF0D8" } }
          };
        }
      }
    }

    formattedData.forEach(row => delete row.__visited);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Permits");
    XLSX.writeFile(workbook, "permits-export.xlsx");
  });
}

function setupImageUploadModal(permitId, geotaggedUrl = '') {
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const modal = document.getElementById('imageUploadModal');
  const dropZone = document.getElementById('dropZone');
  const uploadBtn = document.getElementById('uploadGeotaggedBtn');
  const placeholderURL = './images/placeholder2.png';
  const viewImageLink = document.getElementById('viewImageLink');
  const hiddenInput = document.getElementById('currentGeotaggedUrl');

  const setImage = (src, isPlaceholder = true) => {
    imagePreview.src = src;
    imagePreview.classList.toggle('placeholder', isPlaceholder);
    uploadBtn.classList.toggle('d-none', isPlaceholder);
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result, false);
      reader.readAsDataURL(file);
    }
  };

  imageInput.onchange = () => {
    const file = imageInput.files[0];
    handleFile(file);
  };

  // Drag & drop
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
      e.preventDefault();
      dropZone.classList.add('border-primary');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
      e.preventDefault();
      dropZone.classList.remove('border-primary');
    });
  });

  dropZone.ondrop = (e) => {
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  modal.addEventListener('show.bs.modal', () => {
    setImage(placeholderURL, true);
    hiddenInput.value = geotaggedUrl || '';

    // Show or hide the view button
    if (geotaggedUrl) {
      viewImageLink.href = geotaggedUrl;
      viewImageLink.classList.remove('d-none');
      createDeleteButtonIfNeeded(geotaggedUrl); // 💡 Add delete button if image exists
    } else {
      viewImageLink.classList.add('d-none');
      removeDeleteButton(); // 💡 Ensure delete button is removed
    }
  }, { once: true });

  // Replace upload button
  uploadBtn.replaceWith(uploadBtn.cloneNode(true));
  const freshUploadBtn = document.getElementById('uploadGeotaggedBtn');
  freshUploadBtn.classList.add('d-none');
  freshUploadBtn.addEventListener('click', () => handleGeotaggedUpload(permitId));

  imageInput.onchange = () => {
    const file = imageInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('placeholder');
        freshUploadBtn.classList.remove('d-none');
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a delete button only if it doesn't exist
  function createDeleteButtonIfNeeded() {
    if (document.getElementById('deleteGeotaggedBtn')) return;

    const deleteBtn = document.createElement('button');
    deleteBtn.id = 'deleteGeotaggedBtn';
    deleteBtn.className = 'btn btn-outline-danger';
    deleteBtn.innerHTML = '<i class="bi bi-trash me-1"></i> Delete Image';

    deleteBtn.addEventListener('click', async () => {
      Spinner.show();
      try {
        try {
          deleteBtn.disabled = true;
          deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Deleting...';

          // Delete from storage
          await GeotaggedFileService.delete(hiddenInput.value);

          await Permit.update(permitId, { 
            geotaggedUrl: '',
            visited: false
          });

          setImage(placeholderURL, true);
          hiddenInput.value = '';
          viewImageLink.classList.add('d-none');
          removeDeleteButton();
          renderPermitTable();

          NotificationBox.show('Image deleted and permit updated.');
          
        } catch (err) {
          NotificationBox.show(`Failed to delete image: ${err.message}`, 'danger');
        } finally {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = '<i class="bi bi-trash me-1"></i> Delete Image';
        }
      }
      finally{
        Spinner.hide();
      }
    });

    viewImageLink.parentElement.appendChild(deleteBtn);
  }

  // Remove delete button if exists
  function removeDeleteButton() {
    const deleteBtn = document.getElementById('deleteGeotaggedBtn');
    if (deleteBtn) deleteBtn.remove();
  }
}

async function handleGeotaggedUpload(permitId) {
  Spinner.show();

  try {
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];

    if (!file) {
      NotificationBox.show("No file selected.");
      return;
    }

    if (!permitId) {
      NotificationBox.show("Permit ID is required.");
      return;
    }

    // Fetch existing geotaggedUrl from Firestore
    const existingUrl = document.getElementById('currentGeotaggedUrl').value;

    // Delete old image if it exists
    if (existingUrl) {
      await GeotaggedFileService.delete(existingUrl);
    }

    // Upload new image to Supabase
    const newImageUrl = await GeotaggedFileService.upload(file);
    if (!newImageUrl) {
      NotificationBox.show("Upload failed.");
      return;
    }

    // Update Firestore with new image URL
    await Permit.update(permitId, {
      geotaggedUrl: newImageUrl,
      visited: true
    });
    renderPermitTable();
    NotificationBox.show("Geotagged image updated successfully.");
    const modalEl = document.getElementById('imageUploadModal'); // Replace with your actual modal ID
    const modal = bootstrap.Modal.getInstance(modalEl);
if (modal) modal.hide();
  } catch (error) {
    console.error("Error during upload:", error.message);
    NotificationBox.show("An error occurred: " + error.message);
  } finally {
    Spinner.hide();
  }
}







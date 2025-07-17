import { WUSData } from './wrus-data.js';
import { Permit } from '../permit/permit-data.js';
import { Sidebar } from "../components/sidebar.js";
import { Spinner } from '../components/spinner.js';
import { NotificationBox } from '../components/notification.js';
import { METRO_MANILA_CITIES } from '../constants/metroManilaCities.js';
import { GeotaggedFileService } from '../upload/uploadImg.js';
import { PortalBubble } from '../components/PortalBubble.js';

export function initializePage(){
  Sidebar.render();
  Spinner.render();
  initializeSearchBar();
  loadWaterUser();
  setupWaterSourceFilterToggle();
  setupAddModalCities();
  setupEditModalCities();
  setupPermitAutoComplete('permitNoInput', 'permitSuggestions', 'nameOfWaterUser', 'city', 'wusGeotagUrl');
  setupPermitAutoComplete('permitNoInputEdit', 'permitSuggestionsEdit', 'editOwner', 'editCity', 'editWusGeotagUrl');
  handleAddForm();
  handleEditForm();
  handleRefreshButton({
    buttonId: "refreshBtn",
    refreshFn: WUSData.refreshCache,
    renderFn: renderWaterUsers,
    cooldownKey: "lastWUSRefresh"
  });
  initializeExportButton();
}

let currentPage = 1;
const rowsPerPage = 10;
let allUsers = [];
let searchTerm = '';
let currentSearchTerm = '';

function setupWaterSourceFilterToggle() {
  const section = document.getElementById('waterSourceFilterSection');
  const button = document.getElementById('toggleWaterSourceFilterBtn');
  const waterSourceOnly = document.getElementById('waterSourceOnlyFilter');
  const nonWaterSourceOnly = document.getElementById('nonWaterSourceOnlyFilter');

  // Toggle visibility of filter section
  button.addEventListener('click', () => {
    const isHidden = section.classList.contains('d-none');
    section.classList.toggle('d-none');
    button.textContent = isHidden ? 'Hide Water Source Filter' : 'Show Water Source Filter';
  });

  // Disable the other checkbox when one is checked and re-render table
  waterSourceOnly.addEventListener('change', () => {
    nonWaterSourceOnly.disabled = waterSourceOnly.checked;
    renderWaterUsers(); // refresh table with filter
  });

  nonWaterSourceOnly.addEventListener('change', () => {
    waterSourceOnly.disabled = nonWaterSourceOnly.checked;
    renderWaterUsers(); // refresh table with filter
  });
}

function setupAddModalCities() {
  const citySelect = document.getElementById("city");
  if (!citySelect) return;

  citySelect.innerHTML = '<option selected disabled value="">Select City</option>';

  METRO_MANILA_CITIES.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });
}

function setupEditModalCities() {
  const citySelect = document.getElementById("editCity");
  if (!citySelect) return;

  citySelect.innerHTML = '<option selected disabled value="">Select City</option>';

  METRO_MANILA_CITIES.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });
}

async function setupPermitAutoComplete(inputId, suggestionsId, ownerInputId = null, citySelectId = null, geotagUrlId = null) {
  const permitInput = document.getElementById(inputId);
  const suggestionsBox = document.getElementById(suggestionsId);
  const ownerInput = ownerInputId ? document.getElementById(ownerInputId) : null;
  const citySelect = citySelectId ? document.getElementById(citySelectId) : null;
  const geotagUrlInput = geotagUrlId ? document.getElementById(geotagUrlId) : null;

  if (!permitInput || !suggestionsBox) {
    console.warn(`Elements with IDs '${inputId}' or '${suggestionsId}' not found.`);
    return;
  }

  let allPermits = [];

  try {
    allPermits = await Permit.getAll();
  } catch (err) {
    console.error('Error loading permits:', err.message);
    return;
  }

  permitInput.addEventListener('input', () => {
    const query = permitInput.value.trim().toLowerCase();
    suggestionsBox.innerHTML = '';

    if (!query) {
      suggestionsBox.style.display = 'none';
      return;
    }

    const matches = allPermits
      .filter(p => p.permitNo?.toLowerCase().includes(query))
      .slice(0, 5);

    if (matches.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }

    matches.forEach(p => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'list-group-item list-group-item-action';
      item.textContent = `${p.permitNo} — ${p.permittee || 'Unnamed'}`;
      item.addEventListener('click', async () => {
        PortalBubble.trigger();
        permitInput.value = p.permitNo;

        if (ownerInput) {
          ownerInput.value = p.permittee || '';
        }

        if (citySelect && p.diversionPoint) {
          const diversionLower = p.diversionPoint.toLowerCase();
          let matched = false;

          // Loop through all options and try to match the city name in diversionPoint
          for (const option of citySelect.options) {
            const optionText = option.textContent.toLowerCase();
            if (diversionLower.includes(optionText)) {
              option.selected = true;
              matched = true;
              break;
            }
          }

          if (!matched) {
            citySelect.selectedIndex = 0; // fallback to default (first) option
          }
        }

        // Set geotagged URL if the field exists
        if (geotagUrlInput) {
          try {
            const geotaggedUrl = p.geotaggedUrl || '';
            geotagUrlInput.value = geotaggedUrl || '';
          } catch (err) {
            console.error('Error getting geotagged URL:', err.message);
            geotagUrlInput.value = '';
          }
        }

        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'none';
      });
      suggestionsBox.appendChild(item);
    });

    suggestionsBox.style.display = 'block';
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!permitInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = 'none';
    }
  });
}

function handleAddForm() {
  const form = document.getElementById('addWusForm');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    e.stopPropagation();

    form.classList.add('was-validated');
    if (!form.checkValidity()) {
      return;
    }

    const data = {
      permitNo: form.permitNoInput.value.trim(),
      owner: form.nameOfWaterUser.value.trim(),
      city: form.city.value.trim(),
      barangay: form.barangay.value.trim(),
      street: form.street.value.trim(),
      latitude: form.latitude.value.trim(),
      longitude: form.longitude.value.trim(),
      type: form.type.value.trim(),
      remarks: form.remarks.value.trim(),
      isWaterSource: form.isWaterSource.checked,
      geotaggedUrl : form.wusGeotagUrl.value.trim()
    };

    Spinner.show();
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      await WUSData.add(data);
      allUsers = []; // Clear local cache to force reload

      form.reset();
      form.classList.remove('was-validated');

      const modal = bootstrap.Modal.getInstance(document.getElementById('addwusModal'));
      modal.hide();

      await loadWaterUser();
      NotificationBox.show('Water User added successfully!');
    } catch (err) {
      console.error('Error adding Water User:', err);
      NotificationBox.show('Could not add Water User. Please try again.');
    } finally {
      Spinner.hide();
      submitButton.disabled = false;
    }
  });
}

async function loadWaterUser() {
  Spinner.show();
  try {
    allUsers = await WUSData.fetchAllDesc();
    await renderWaterUsers();
  } finally {
    Spinner.hide();
  }
}

async function renderWaterUsers(term = '') {
  const tableBody = document.getElementById('waterUserTableBody');
  tableBody.innerHTML = '';

  if (allUsers.length === 0) {
    allUsers = await WUSData.fetchAllDesc();
  }

  function normalizeText(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;
    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchTerm);

    const index = normalizedText.indexOf(normalizedSearch);
    if (index === -1) return text;

    const originalIndex = [...text].findIndex((_, i) =>
      normalizeText(text.slice(i)).startsWith(normalizedSearch)
    );

    return (
      text.slice(0, originalIndex) +
      '<mark>' + text.slice(originalIndex, originalIndex + searchTerm.length) + '</mark>' +
      text.slice(originalIndex + searchTerm.length)
    );
  }

  const waterSourceOnly = document.getElementById('waterSourceOnlyFilter');
  const nonWaterSourceOnly = document.getElementById('nonWaterSourceOnlyFilter');

  let filteredUsers = allUsers;

  if (waterSourceOnly.checked) {
    filteredUsers = filteredUsers.filter(u => u.isWaterSource === true);
  } else if (nonWaterSourceOnly.checked) {
    filteredUsers = filteredUsers.filter(u => u.isWaterSource === false);
  }

  const searchTerm = term.trim();
  const normalizedSearch = normalizeText(searchTerm);

  if (normalizedSearch) {
    filteredUsers = filteredUsers.filter(u =>
      normalizeText(u.id || '').includes(normalizedSearch) ||
      normalizeText(u.owner || '').includes(normalizedSearch) ||
      normalizeText(u.street || '').includes(normalizedSearch) ||
      normalizeText(u.barangay || '').includes(normalizedSearch) ||
      normalizeText(u.city || '').includes(normalizedSearch) ||
      normalizeText(u.permitNo || '').includes(normalizedSearch) ||
      (u.latitude || '').toString().includes(normalizedSearch) ||
      (u.longitude || '').toString().includes(normalizedSearch)
    );
  }

  localStorage.setItem('filteredWaterUsers', JSON.stringify(filteredUsers));

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const usersToDisplay = filteredUsers.slice(start, end);

  usersToDisplay.forEach(user => {
    const tr = document.createElement('tr');

    const ownerName = highlightMatch(user.owner || '', searchTerm);

    const badges = [];
    if (user.permitNo) {
      badges.push(`<span class="badge-3d badge-permittee me-1">Permittee: ${user.permitNo}</span>`);
    }
    if (user.isWaterSource) {
      badges.push(`<span class="badge-3d badge-water-source me-1">Water Source</span>`);
    }

    const badgesHTML = badges.length > 0 ? `<div class="mt-1">${badges.join(' ')}</div>` : '';

    tr.innerHTML = `
      <td>${ownerName}${badgesHTML}</td>
      <td>${highlightMatch(user.street || '', searchTerm)}</td>
      <td>${highlightMatch(user.barangay || '', searchTerm)}</td>
      <td>${highlightMatch(user.city || '', searchTerm)}</td>
      <td>${highlightMatch(user.latitude ? Number(user.latitude).toFixed(5) : '', searchTerm)}</td>
      <td>${highlightMatch(user.longitude ? Number(user.longitude).toFixed(5) : '', searchTerm)}</td>
      <td>
        <button class="btn btn-3d btn-sm btn-warning edit-btn" data-id="${user.id}">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-3d btn-sm btn-info geotag-btn" data-id="${user.id}">
          <i class="bi bi-geo-alt-fill"></i>
        </button>
      </td>
    `;

    const geotagBtn = tr.querySelector('.geotag-btn');
    geotagBtn.addEventListener('click', () => {
      const geotaggedUrl = user?.geotaggedUrl || '';
      console.log('GeoTag button clicked:', user);

      setupImageUploadModal(user.id, geotaggedUrl, user.permitNo);
      const modal = new bootstrap.Modal(document.getElementById('imageUploadModal'));
      modal.show();
    });

    tableBody.appendChild(tr);
  });

  attachEditListeners(filteredUsers);
  renderPagination(totalPages);
}

function handleRefreshButton({
  buttonId,
  refreshFn,
  renderFn,
  cooldownKey,
  cooldownSeconds = 60
}) {
  const refreshBtn = document.getElementById(buttonId);
  const LAST_REFRESH_KEY = cooldownKey;

  function getRemainingCooldown() {
    const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
    if (!lastRefresh) return 0;
    const elapsed = (Date.now() - parseInt(lastRefresh, 10)) / 1000;
    return Math.max(0, cooldownSeconds - Math.floor(elapsed));
  }

  function startCooldown() {
    localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString());
    let remaining = cooldownSeconds;
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

  // On page load: apply cooldown if active
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
      await refreshFn();
      await WUSData.refreshCache();
      await renderWaterUsers(currentSearchTerm);
      renderFn();
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

function attachEditListeners(filteredUsers) {
  const tableBody = document.getElementById('waterUserTableBody');
  tableBody.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      const user = filteredUsers.find(u => u.id === id);
      if (!user) return;

      // Populate form fields
      document.getElementById('editWusId').value = user.id || '';
      document.getElementById('editOwner').value = user.owner || '';
      document.getElementById('editStreet').value = user.street || '';
      document.getElementById('editBarangay').value = user.barangay || '';
      document.getElementById('editCity').value = user.city || '';
      document.getElementById('editLatitude').value = user.latitude || '';
      document.getElementById('editLongitude').value = user.longitude || '';
      document.getElementById('editType').value = user.type || '';
      document.getElementById('editRemarks').value = user.remarks || '';
      document.getElementById('editIsWaterSource').checked = !!user.isWaterSource;

      document.getElementById('permitNoInputEdit').value = user.permitNo || '';
      document.getElementById('editWusGeotagUrl').value = user.geotaggedUrl || '';

      const modal = new bootstrap.Modal(document.getElementById('editwusModal'));
      modal.show();
    });
  });
}

function renderPagination(totalPages) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  // Previous Button
  const prevItem = document.createElement('li');
  prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevItem.innerHTML = `
    <a class="page-link" href="#">Previous</a>
  `;
  prevItem.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      renderWaterUsers(searchTerm);
    }
  });
  pagination.appendChild(prevItem);

  // Numbered Buttons (Limit to 5 pages around current page)
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = startPage + maxVisible - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageItem = document.createElement('li');
    pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageItem.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = i;
      renderWaterUsers(searchTerm);
    });
    pagination.appendChild(pageItem);
  }

  // Next Button
  const nextItem = document.createElement('li');
  nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextItem.innerHTML = `
    <a class="page-link" href="#">Next</a>
  `;
  nextItem.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      renderWaterUsers(searchTerm);
    }
  });
  pagination.appendChild(nextItem);
}

function handleEditForm() {
  const form = document.getElementById('editWusForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    Spinner.show();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const id = document.getElementById('editWusId').value;
    const payload = {
      owner: document.getElementById('editOwner').value.trim(),
      street: document.getElementById('editStreet').value.trim(),
      barangay: document.getElementById('editBarangay').value.trim(),
      city: document.getElementById('editCity').value.trim(),
      latitude: document.getElementById('editLatitude').value.trim(),
      longitude: document.getElementById('editLongitude').value.trim(),
      type: document.getElementById('editType').value.trim(),
      remarks: document.getElementById('editRemarks').value.trim(),
      isWaterSource: document.getElementById('editIsWaterSource').checked,
      permitNo: document.getElementById('permitNoInputEdit').value.trim(),
      geotaggedUrl: document.getElementById('editWusGeotagUrl').value.trim()
    };

    try {
      await WUSData.update(id, payload);

      const modal = bootstrap.Modal.getInstance(document.getElementById('editwusModal'));
      modal.hide();

      form.reset();
      form.classList.remove('was-validated');

      allUsers = await WUSData.fetchAllDesc();
      await renderWaterUsers(currentSearchTerm);

      NotificationBox.show('Water User updated successfully!');
    } catch (err) {
      console.error('Error updating Water User:', err);
      NotificationBox.show('Failed to update. Please try again.');
    } finally {
      Spinner.hide();
      submitBtn.disabled = false;
    }
  });
}

function initializeSearchBar() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    currentSearchTerm = searchInput.value;
    renderWaterUsers(currentSearchTerm);
  });
}

function initializeExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const XLSX = window.XLSX; // Get XLSX from global scope

    if (!XLSX || !XLSX.utils) {
      alert('XLSX library not loaded.');
      return;
    }

    const filteredUsers = JSON.parse(localStorage.getItem('filteredWaterUsers') || '[]');

    if (filteredUsers.length === 0) {
      alert('No filtered data to export.');
      return;
    }

    const dataForExcel = filteredUsers.map(user => ({
      Owner: user.owner || '',
      Street: user.street || '',
      Barangay: user.barangay || '',
      City: user.city || '',
      Latitude: user.latitude || '',
      Longitude: user.longitude || '',
      IsWaterSource: user.isWaterSource ? 'Yes' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FilteredUsers');
    XLSX.writeFile(workbook, 'FilteredWaterUsers.xlsx');
  });
}

function setupImageUploadModal(wusId, geotaggedUrl = '', permitNo = '') {
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const modal = document.getElementById('imageUploadModal');
  const dropZone = document.getElementById('dropZone');
  const placeholderURL = './images/placeholder2.png';
  const viewImageLink = document.getElementById('viewImageLink');
  const hiddenInput = document.getElementById('currentGeotaggedUrl');
  const permitNoInput = document.getElementById('currentPermitNo');

  const setImage = (src, isPlaceholder = true) => {
    imagePreview.src = src;
    imagePreview.classList.toggle('placeholder', isPlaceholder);
    const uploadBtn = document.getElementById('uploadGeotaggedBtn');
    if (uploadBtn) {
      uploadBtn.classList.toggle('d-none', isPlaceholder);
    }
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result, false);
      reader.readAsDataURL(file);
    }
  };

  // Drag-and-drop events
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
    if (file) handleFile(file);
  };

  // Bootstrap modal show event
  modal.addEventListener('show.bs.modal', () => {
    setImage(placeholderURL, true);
    hiddenInput.value = geotaggedUrl || '';
    imageInput.value = '';

    // Set permitNo into hidden input
    if (permitNoInput) {
      permitNoInput.value = permitNo || '';
      console.log('Permit No passed to modal:', permitNo);
    }

    if (geotaggedUrl) {
      viewImageLink.href = geotaggedUrl;
      viewImageLink.classList.remove('d-none');
      createDeleteButtonIfNeeded();
    } else {
      viewImageLink.classList.add('d-none');
      removeDeleteButton();
    }

    refreshUploadButton();
  });


  const refreshUploadButton = () => {
    let uploadBtn = document.getElementById('uploadGeotaggedBtn');
    if (!uploadBtn || !uploadBtn.parentNode) {
      console.warn('uploadBtn or its parentNode is null. Skipping button refresh.');
      return;
    }

    const newBtn = uploadBtn.cloneNode(true);
    uploadBtn.parentNode.replaceChild(newBtn, uploadBtn);
    uploadBtn = newBtn;
    uploadBtn.classList.add('d-none');
    uploadBtn.addEventListener('click', () => handleGeotaggedUpload(wusId, permitNo));
  };

  // Image file input
  imageInput.onchange = () => {
    const file = imageInput.files[0];
    const uploadBtn = document.getElementById('uploadGeotaggedBtn');
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result, false);
        if (uploadBtn) {
          uploadBtn.classList.remove('d-none');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  function createDeleteButtonIfNeeded() {
    removeDeleteButton();

    const deleteBtn = document.createElement('button');
    deleteBtn.id = 'deleteGeotaggedBtn';
    deleteBtn.className = 'btn btn-3d btn-outline-danger';
    deleteBtn.innerHTML = '<i class="bi bi-trash me-1"></i> Delete Image';

    deleteBtn.addEventListener('click', async () => {
      Spinner.show();
      try {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Deleting...';

        // Delete image from storage
        await GeotaggedFileService.delete(hiddenInput.value);

        // Attempt to update Permit if permitNo exists
        if (permitNo) {
          try {
            const permits = await Permit.getAll(); // cached
            const targetPermit = permits.find(p => p.permitNo === permitNo);

            if (targetPermit) {
              await Permit.update(targetPermit.id, { geotaggedUrl: '' });
            } else {
              console.warn(`Permit with Permit No "${permitNo}" not found. Skipping Permit update.`);
            }
          } catch (permitErr) {
            console.warn("Error updating permit record:", permitErr);
          }
        }

        // UI updates
        setImage(placeholderURL, true);
        hiddenInput.value = '';
        viewImageLink.classList.add('d-none');
        removeDeleteButton();

        allUsers = await WUSData.fetchAllDesc();
        await renderWaterUsers(currentSearchTerm);

        NotificationBox.show('Image deleted and water user updated.');
      } catch (err) {
        NotificationBox.show(`Failed to delete image: ${err.message}`, 'danger');
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="bi bi-trash me-1"></i> Delete Image';
        Spinner.hide();
      }
    });

    viewImageLink.parentElement.appendChild(deleteBtn);
  }

  function removeDeleteButton() {
    const deleteBtn = document.getElementById('deleteGeotaggedBtn');
    if (deleteBtn) deleteBtn.remove();
  }
}

async function handleGeotaggedUpload(wusId, permitNo) {
  Spinner.show();

  try {
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];

    if (!file) {
      NotificationBox.show("No file selected.");
      return;
    }

    const existingUrl = document.getElementById('currentGeotaggedUrl').value;

    // Delete old image from storage
    if (existingUrl) {
      await GeotaggedFileService.delete(existingUrl);
    }

    // Upload new image
    const newImageUrl = await GeotaggedFileService.upload(file);
    if (!newImageUrl) {
      NotificationBox.show("Upload failed.");
      return;
    }

    let permitUpdated = false;

    // ✅ Try updating the Permit if permitNo exists
    if (permitNo) {
      try {
        const permits = await Permit.getAll(); // cached
        const targetPermit = permits.find(p => p.permitNo === permitNo);

        if (targetPermit) {
          await Permit.update(targetPermit.id, {
            geotaggedUrl: newImageUrl
          });
          permitUpdated = true;
        } else {
          console.warn(`Permit No "${permitNo}" not found in cache. Skipping permit update.`);
        }
      } catch (permitErr) {
        console.error("Error updating permit record:", permitErr);
      }
    }

    // ✅ Always update WUS record
    await WUSData.update(wusId, {
      geotaggedUrl: newImageUrl
    });

    allUsers = await WUSData.fetchAllDesc();
    await renderWaterUsers(currentSearchTerm);

    NotificationBox.show(
      permitUpdated
        ? "Geotagged image updated for both Water User and Permit."
        : "Geotagged image updated for Water User only."
    );

    // Close modal
    const modalEl = document.getElementById('imageUploadModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  } catch (error) {
    console.error("Error during upload:", error.message);
    NotificationBox.show("An error occurred: " + error.message);
  } finally {
    Spinner.hide();
  }
}
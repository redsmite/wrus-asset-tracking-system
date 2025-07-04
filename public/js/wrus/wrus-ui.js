import { WUSData } from './wrus-data.js';
import { Sidebar } from "../components/sidebar.js";
import { Spinner } from '../components/spinner.js';
import { NotificationBox } from '../components/notification.js';

export function initializePage(){
  Sidebar.render();
  Spinner.render();
  initializeSearchBar();
  loadWaterUser();
  handleAddForm();
  handleEditForm();
  handleRefreshButton();
}

let currentPage = 1;
const rowsPerPage = 10;
let allUsers = [];
let searchTerm = '';

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
      nameOfWaterUser: form.nameOfWaterUser.value.trim(),
      location: form.location.value.trim(),
      latitude: form.latitude.value.trim(),
      longitude: form.longitude.value.trim(),
      type: form.type.value.trim(),
      remarks: form.remarks.value.trim(),
      isWaterSource: form.isWaterSource.checked,
    };

    Spinner.show();
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      await WUSData.add(data);
      allUsers = []; // Clear cache to force reload

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
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
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

  const searchTerm = term.trim();
  const normalizedSearch = normalizeText(searchTerm);

  const filteredUsers = normalizedSearch
    ? allUsers.filter(u =>
        normalizeText(u.id || '').includes(normalizedSearch) ||
        normalizeText(u.nameOfWaterUser || '').includes(normalizedSearch) ||
        normalizeText(u.location || '').includes(normalizedSearch) ||
        normalizeText(u.type || '').includes(normalizedSearch) ||
        normalizeText(u.remarks || '').includes(normalizedSearch) ||
        (u.latitude || '').toString().includes(normalizedSearch) ||
        (u.longitude || '').toString().includes(normalizedSearch)
      )
    : allUsers;

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const usersToDisplay = filteredUsers.slice(start, end);

  usersToDisplay.forEach(user => {
    const tr = document.createElement('tr');
    if (user.isWaterSource) tr.classList.add('table-info');

    tr.innerHTML = `
      <td>${highlightMatch(user.id || '', searchTerm)}</td>
      <td>${highlightMatch(user.nameOfWaterUser || '', searchTerm)}</td>
      <td>${highlightMatch(user.location || '', searchTerm)}</td>
      <td>${highlightMatch(user.latitude?.toString() || '', searchTerm)}</td>
      <td>${highlightMatch(user.longitude?.toString() || '', searchTerm)}</td>
      <td>${highlightMatch(user.type || '', searchTerm)}</td>
      <td>${highlightMatch(user.remarks || '', searchTerm)}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-btn" data-id="${user.id}">
          <i class="bi bi-pencil-square"></i> Update
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  attachEditListeners(filteredUsers);
  renderPagination(totalPages);
}


function handleRefreshButton(){
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', ()=>{
      renderWaterUsers();
      NotificationBox.show("Refreshed successfully.");
    })
}

function attachEditListeners(filteredUsers) {
  const tableBody = document.getElementById('waterUserTableBody');
  tableBody.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      const user = filteredUsers.find(u => u.id === id);
      if (!user) return;

      document.getElementById('editWusId').value = user.id;
      document.getElementById('editNameOfWaterUser').value = user.nameOfWaterUser || '';
      document.getElementById('editLocation').value = user.location || '';
      document.getElementById('editLatitude').value = user.latitude || '';
      document.getElementById('editLongitude').value = user.longitude || '';
      document.getElementById('editType').value = user.type || '';
      document.getElementById('editRemarks').value = user.remarks || '';
      document.getElementById('editIsWaterSource').checked = !!user.isWaterSource;

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
      nameOfWaterUser: document.getElementById('editNameOfWaterUser').value.trim(),
      location: document.getElementById('editLocation').value.trim(),
      latitude: document.getElementById('editLatitude').value.trim(),
      longitude: document.getElementById('editLongitude').value.trim(),
      type: document.getElementById('editType').value.trim(),
      remarks: document.getElementById('editRemarks').value.trim(),
      isWaterSource: document.getElementById('editIsWaterSource').checked,
    };

    try {
      await WUSData.update(id, payload);

      const modal = bootstrap.Modal.getInstance(document.getElementById('editwusModal'));
      modal.hide();

      form.reset();
      form.classList.remove('was-validated');

      await loadWaterUser();
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
    const term = searchInput.value;
    renderWaterUsers(term);
  });
}

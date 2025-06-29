import { WUSData } from './wrus-data.js';
import { Sidebar } from "../components/sidebar.js";
import { Spinner } from '../components/spinner.js';

export function initializePage(){
  Sidebar.render();
  loadWaterUser();
  initializeSearchBar();
  handleAddForm();
  handleEditForm();
}

let currentPage = 1;
const rowsPerPage = 10;  // You can change to any number
let allUsers = [];       // Global to store fetched users

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
      alert('Water User added successfully!');
    } catch (err) {
      console.error('Error adding Water User:', err);
      alert('Could not add Water User. Please try again.');
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

async function renderWaterUsers(searchTerm = '') {
  const tableBody = document.getElementById('waterUserTableBody');
  tableBody.innerHTML = '';

  if (allUsers.length === 0) {
    // Fetch once
    allUsers = await WUSData.fetchAllDesc();
  }

  const term = searchTerm.trim().toLowerCase();
  const filteredUsers = term
    ? allUsers.filter(u =>
        (u.nameOfWaterUser   || '').toLowerCase().includes(term) ||
        (u.location          || '').toLowerCase().includes(term) ||
        (u.type              || '').toLowerCase().includes(term) ||
        (u.remarks           || '').toLowerCase().includes(term) ||
        (u.latitude          || '').toString().includes(term) ||
        (u.longitude         || '').toString().includes(term)
      )
    : allUsers;

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const usersToDisplay = filteredUsers.slice(start, end);

  usersToDisplay.forEach(user => {
    const tr = document.createElement('tr');
    if (user.isWaterSource) tr.classList.add('table-info');
    tr.innerHTML = `
      <td>${user.nameOfWaterUser || ''}</td>
      <td>${user.location || ''}</td>
      <td>${user.latitude || ''}</td>
      <td>${user.longitude || ''}</td>
      <td>${user.type || ''}</td>
      <td>${user.remarks || ''}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-btn" data-id="${user.id}">
          <i class="bi bi-pencil-square"></i> Edit
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Attach edit button listeners
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

  // Update pagination info
  document.getElementById('paginationInfo').textContent = `Page ${currentPage} of ${totalPages}`;

  // Disable/enable buttons
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
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
      alert('Water User updated successfully!');
    } catch (err) {
      console.error('Error updating Water User:', err);
      alert('Failed to update. Please try again.');
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

document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderWaterUsers(document.getElementById('searchInput').value);
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  currentPage++;
  renderWaterUsers(document.getElementById('searchInput').value);
});

document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 1;  // Reset to first page on new search
  renderWaterUsers(document.getElementById('searchInput').value);
});


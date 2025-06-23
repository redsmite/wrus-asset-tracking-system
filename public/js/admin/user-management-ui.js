import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { addUser, fetchUsers, updateUser } from './user-management-data.js';
import { renderSpinner, showSpinner, hideSpinner } from '../components/spinner.js';
import { adminVerification } from './admin-verification.js';
import { renderAdminSidebar } from './admin-sidebar.js';

let currentPage = 1;
const usersPerPage = 7;
let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
  renderAdminSidebar();
  adminVerification();
  renderSpinner();
  renderUsersTable();
  handleAddUserModal();
  setupAddUserForm();
  handleSearchBar();
});

function handleAddUserModal(){
  document.getElementById('showAddUserFormBtn').addEventListener('click', () => {
    const modalElement = document.getElementById('addUserModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  });
}

function setupAddUserForm() {
  const addUserForm = document.getElementById("addUserForm");
  const addUserModalEl = document.getElementById('addUserModal');

  addUserForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    // ✅ Custom password match check
    if (password.value !== confirmPassword.value) {
      confirmPassword.setCustomValidity("Passwords do not match");
    } else {
      confirmPassword.setCustomValidity("");
    }

    // ✅ Bootstrap validation styling
    this.classList.add("was-validated");

    if (!this.checkValidity()) {
      return;
    }

    showSpinner();
    try {
      const username = document.getElementById("username").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const firstName = document.getElementById("firstName").value.trim();
      const middleInitial = document.getElementById("middleInitial").value.trim();
      const natureOfAppointment = document.getElementById("natureOfAppointment").value.trim();
      const status = document.querySelector('input[name="status"]:checked')?.value;

      if (!natureOfAppointment) {
        alert("Please select the nature of appointment.");
        return;
      }

      const existingUsers = await fetchUsers();
      const usernameExists = existingUsers.some(
        user => user.username?.toLowerCase() === username.toLowerCase()
      );

      if (usernameExists) {
        alert("Username already exists.");
        return;
      }

      const hashedPassword = await bcrypt.hash(password.value, 10);

      await addUser({
        username,
        lastName,
        firstName,
        middleInitial,
        natureOfAppointment,
        password: hashedPassword,
        status,
        role: 'user'
      });

      alert('User successfully added');
      await renderUsersTable(); // Ensure it's awaited
      addUserForm.reset();
      addUserForm.classList.remove("was-validated");
      const modal = bootstrap.Modal.getInstance(addUserModalEl);
      modal.hide();
    } catch (err) {
      console.error("Error creating user:", err.message);
      alert("Error creating user: " + err.message);
    } finally {
      hideSpinner();
    }
  });
}

async function renderUsersTable(page = 1, searchQuery = "") {
  showSpinner();
  try {
    const usersTableBody = document.getElementById("usersTableBody");

    // ✅ Always refresh users list
    allUsers = await fetchUsers();

    let filteredUsers = allUsers.filter(user => user.type && user.type.trim() !== "");

    if (searchQuery) {
      filteredUsers = filteredUsers.filter(user =>
        (user.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.lastName || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const start = (page - 1) * usersPerPage;
    const end = start + usersPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);

    usersTableBody.innerHTML = "";

    paginatedUsers.forEach(user => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.username || ''}</td>
        <td>${user.lastName || ''}</td>
        <td>${user.firstName || ''}</td>
        <td>${user.middleInitial || ''}</td>
        <td>${user.type || ''}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${user.id}">
            <i class="bi bi-pencil-square me-1"></i> Edit
          </button>
        </td>

      `;
      usersTableBody.appendChild(row);
    });

    handleEditButtons();
    handleEditSubmit();
    renderPaginationControls(Math.ceil(filteredUsers.length / usersPerPage), page, searchQuery);

  } finally {
    hideSpinner();
  }
}

function handleEditButtons() {
  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const userId = button.getAttribute("data-id");

      const users = await fetchUsers();
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Fill modal fields
      document.getElementById("editUserId").value = user.id;
      document.getElementById("editUsername").value = user.username || '';
      document.getElementById("editLastName").value = user.lastName || '';
      document.getElementById("editFirstName").value = user.firstName || '';
      document.getElementById("editMiddleInitial").value = user.middleInitial || '';

      // Set nature of appointment
      document.getElementById("editNatureOfAppointment").value = user.type || '';
      // Set status
      if (user.status === "active") {
        document.getElementById("editStatusActive").checked = true;
      } else {
        document.getElementById("editStatusInactive").checked = true;
      }

      // Clear password fields
      document.getElementById("editPassword").value = '';
      document.getElementById("editConfirmPassword").value = '';

      // Show modal
      const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
      modal.show();
    });
  });
}

function handleEditSubmit() {
  const form = document.getElementById("editUserForm");

  // Avoid double-binding
  form.removeEventListener("submit", editSubmitHandler);
  form.addEventListener("submit", editSubmitHandler);
}

async function editSubmitHandler(e) {
  e.preventDefault();
  showSpinner();

  try {
    const id = document.getElementById("editUserId").value;
    const username = document.getElementById("editUsername").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();
    const firstName = document.getElementById("editFirstName").value.trim();
    const middleInitial = document.getElementById("editMiddleInitial").value.trim();
    const status = document.querySelector('input[name="editStatus"]:checked')?.value;
    const type = document.getElementById("editNatureOfAppointment")?.value;

    const password = document.getElementById("editPassword").value.trim();
    const confirmPassword = document.getElementById("editConfirmPassword").value.trim();

    // ✅ Check if username already exists (excluding current user)
    const users = await fetchUsers();
    const usernameExists = users.some(
      (user) =>
        (user.username || '').toLowerCase() === username.toLowerCase() &&
        user.id !== id
    );

    if (usernameExists) {
      alert("Username already exists. Please choose another one.");
      return;
    }

    let updateData = {
      username,
      lastName,
      firstName,
      middleInitial,
      status,
      type
    };

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await updateUser(id, updateData);

    alert("User updated successfully");

    // ✅ Hide modal properly
    const modalEl = document.getElementById("editUserModal");
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.hide();

    // ✅ Force cleanup in case of lingering backdrop/modal-open class
    setTimeout(() => {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    }, 300);

    await renderUsersTable();
    handleEditButtons();

  } catch (error) {
    console.error("Error submitting edit form:", error);
    alert("An error occurred while updating the user.");
  } finally {
    hideSpinner();
  }
}

function renderPaginationControls(totalPages, current, searchQuery = "") {
  const paginationContainer = document.getElementById("paginationControls");
  paginationContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `btn btn-sm ${i === current ? 'btn-primary' : 'btn-outline-primary'} mx-1`;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderUsersTable(i, searchQuery);
    });
    paginationContainer.appendChild(btn);
  }
}

function handleSearchBar(){
    document.getElementById("searchInput").addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    currentPage = 1;
    renderUsersTable(currentPage, query);
  });
}
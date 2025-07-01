import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { Users } from './user-data.js';
import { Spinner } from '../components/spinner.js';
import { Sidebar } from '../components/sidebar.js';
import { adminVerification } from '../admin/admin-verification.js';
import { NotificationBox } from "../components/notification.js";

let currentPage = 1;
const usersPerPage = 7;
let allUsers = [];

export function initializePage(){
  Sidebar.render();
  adminVerification();
  Spinner.render();
  loadUsers();
  initializeAddUserModal();
  handleSearchBar();
}

async function loadUsers() {
  Spinner.show();
  try {
    allUsers = await Users.fetchAllDesc();
    renderUsersTable();
  } finally {
    Spinner.hide();
  }
}

function initializeAddUserModal() {
  const showAddUserFormBtn = document.getElementById('showAddUserFormBtn');
  const addUserForm = document.getElementById('addUserForm');
  const addUserModalEl = document.getElementById('addUserModal');
  const modal = new bootstrap.Modal(addUserModalEl);

  // 👉 Handle opening the modal
  showAddUserFormBtn.addEventListener('click', () => {
    addUserForm.reset();
    addUserForm.classList.remove("was-validated");
    modal.show();
  });

  // 👉 Handle form submission
  addUserForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const lastName = document.getElementById("lastName").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const middleInitial = document.getElementById("middleInitial").value.trim();
    const position = document.getElementById("position").value.trim();
    const duty = document.getElementById("duty").value;
    const natureOfAppointment = document.getElementById("natureOfAppointment").value;
    const status = document.querySelector('input[name="status"]:checked')?.value;

    // 🔐 Password match validation
    const confirmPasswordInput = document.getElementById("confirmPassword");
    if (password !== confirmPassword) {
      confirmPasswordInput.setCustomValidity("Passwords do not match");
    } else {
      confirmPasswordInput.setCustomValidity("");
    }

    this.classList.add("was-validated");

    if (!this.checkValidity()) return;

    Spinner.show();
    try {
      const existingUsers = await Users.fetchAllDesc();

      // 🔎 Username duplication check
      const usernameExists = existingUsers.some(
        (user) => user.username?.toLowerCase() === username.toLowerCase()
      );
      if (usernameExists) {
        NotificationBox.show("Username already exists.");
        return;
      }

      // 🔎 Supervisor uniqueness check
      if (duty === "Supervisor") {
        const supervisorExists = existingUsers.some(
          (user) => user.duty === "Supervisor"
        );
        if (supervisorExists) {
          NotificationBox.show("A user with 'Supervisor' duty already exists. Only one supervisor is allowed.");
          return;
        }
      }

      // 🔐 Password hashing
      const hashedPassword = await bcrypt.hash(password, 10);

      // 💾 Add to database
      await Users.add({
        username,
        password: hashedPassword,
        lastName,
        firstName,
        middleInitial,
        position,
        duty,
        type: natureOfAppointment,
        status,
        role: "user",
      });

      NotificationBox.show("User successfully added.");
      await loadUsers();

      // ✅ Reset form and close modal
      addUserForm.reset();
      addUserForm.classList.remove("was-validated");
      modal.hide();
    } catch (err) {
      console.error("Error creating user:", err.message);
      NotificationBox.show("Error creating user: " + err.message);
    } finally {
      Spinner.hide();
    }
  });
}

function renderUsersTable(page = 1, searchQuery = "") {
  const usersTableBody = document.getElementById("usersTableBody");

  let filteredUsers = allUsers.filter(user => user.type && user.type.trim() !== "");

  if (searchQuery) {
    filteredUsers = filteredUsers.filter(user =>
      (user.username || "").toLowerCase().includes(searchQuery) ||
      (user.firstName || "").toLowerCase().includes(searchQuery) ||
      (user.lastName || "").toLowerCase().includes(searchQuery)
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
      <td>${user.position || ''}</td>
      <td>${user.type || ''}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${user.id}">
          <i class="bi bi-pencil-square me-1"></i> Edit
        </button>
      </td>
    `;
    usersTableBody.appendChild(row);
  });

  initializeEditFunctionality();
  renderPaginationControls(Math.ceil(filteredUsers.length / usersPerPage), page, searchQuery);
}

function initializeEditFunctionality() {
  // Handle Edit Button Click
  document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const userId = button.getAttribute("data-id");
      const users = await Users.fetchAllDesc();
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Populate form
      document.getElementById("editUserId").value = user.id;
      document.getElementById("editUsername").value = user.username || '';
      document.getElementById("editLastName").value = user.lastName || '';
      document.getElementById("editFirstName").value = user.firstName || '';
      document.getElementById("editMiddleInitial").value = user.middleInitial || '';
      document.getElementById("editPosition").value = user.position || '';
      document.getElementById("editDuty").value = user.duty || '';
      document.getElementById("editNatureOfAppointment").value = user.type || '';

      // Status Radio
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

  // Handle Form Submit
  const form = document.getElementById("editUserForm");
  form.onsubmit = async (e) => {
    e.preventDefault();
    Spinner.show();

    try {
      const id = document.getElementById("editUserId").value.trim();
      const username = document.getElementById("editUsername").value.trim();
      const lastName = document.getElementById("editLastName").value.trim();
      const firstName = document.getElementById("editFirstName").value.trim();
      const middleInitial = document.getElementById("editMiddleInitial").value.trim();
      const position = document.getElementById("editPosition").value.trim();
      const duty = document.getElementById("editDuty").value;
      const type = document.getElementById("editNatureOfAppointment").value;
      const status = document.querySelector('input[name="editStatus"]:checked')?.value;

      const password = document.getElementById("editPassword").value.trim();
      const confirmPassword = document.getElementById("editConfirmPassword").value.trim();

      // ✅ Basic Validation
      if (!username || !lastName || !firstName || !position || !duty || !type || !status) {
        NotificationBox.show("Please fill in all required fields.");
        return;
      }

      const users = await Users.fetchAllDesc();

      // ✅ Username duplicate check
      const usernameExists = users.some(
        (user) => 
          (user.username || '').toLowerCase() === username.toLowerCase() && 
          user.id !== id
      );

      if (usernameExists) {
        NotificationBox.show("Username already exists. Please choose another one.");
        return;
      }

      // ✅ Password confirmation
      if ((password || confirmPassword) && password !== confirmPassword) {
        NotificationBox.show("Passwords do not match.");
        return;
      }

      if (duty === "Supervisor") {
        const existingSupervisor = users.find(
          (user) => user.duty === "Supervisor" && user.id !== id
        );
        if (existingSupervisor) {
          NotificationBox.show("A supervisor already exists. Only one supervisor is allowed.");
          return;
        }
      }

      // ✅ Prepare update data
      let updateData = {
        username,
        lastName,
        firstName,
        middleInitial,
        position,
        duty,
        type,
        status
      };

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      await Users.update(id, updateData);

      NotificationBox.show("User updated successfully.");

      const modalEl = document.getElementById("editUserModal");
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.hide();

      setTimeout(() => {
        document.body.classList.remove("modal-open");
        document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
      }, 300);

      await loadUsers();
    } catch (error) {
      console.error("Error submitting edit form:", error);
      NotificationBox.show("An error occurred while updating the user.");
    } finally {
      Spinner.hide();
    }
  };
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

function handleSearchBar() {
  document.getElementById("searchInput").addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    currentPage = 1;
    renderUsersTable(currentPage, query);
  });
}
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { addUser, fetchUsers, updateUser } from './user-management-data.js';

let currentPage = 1;
const usersPerPage = 7;
let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
  renderUsersTable();
  addUserUI();
  handleSearchBar();
});

function addUserUI (){
const showAddUserBtn = document.getElementById('showAddUserFormBtn');
  const addUserModalEl = document.getElementById('addUserModal');

  if (showAddUserBtn && addUserModalEl) {
    showAddUserBtn.addEventListener('click', () => {
      const modal = new bootstrap.Modal(addUserModalEl);
      modal.show();
    });
  }

  // Add user form submission
  const addUserForm = document.getElementById("addUserForm");

  addUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const username = document.getElementById("username").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const middleInitial = document.getElementById("middleInitial").value.trim();
    const status = document.querySelector('input[name="status"]:checked').value;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      await addUser({
        username,
        lastName,
        firstName,
        middleInitial,
        password: hashedPassword,
        status,
        role: 'user'
      });

      addUserForm.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById("addUserModal"));
      modal.hide();
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user.");
    }
  });
}
async function renderUsersTable(page = 1, searchQuery = "") {
  const usersTableBody = document.getElementById("usersTableBody");

  if (allUsers.length === 0) {
    try {
      allUsers = await fetchUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
      return;
    }
  }

  let filteredUsers = allUsers;

  if (searchQuery) {
    filteredUsers = allUsers.filter(user =>
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
      <td>${user.middleInitial || ''}</td>
      <td>${user.status || ''}</td>
      <td><button class="btn btn-sm btn-primary edit-btn" data-id="${user.id}">Edit</button></td>
    `;
    usersTableBody.appendChild(row);
  });

  handleEditButtons();
  handleEditSubmit();

  renderPaginationControls(Math.ceil(filteredUsers.length / usersPerPage), page, searchQuery);
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

function handleEditSubmit(){
  document.getElementById("editUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editUserId").value;
    const username = document.getElementById("editUsername").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();
    const firstName = document.getElementById("editFirstName").value.trim();
    const middleInitial = document.getElementById("editMiddleInitial").value.trim();
    const status = document.querySelector('input[name="editStatus"]:checked').value;

    const password = document.getElementById("editPassword").value.trim();
    const confirmPassword = document.getElementById("editConfirmPassword").value.trim();

    let updateData = {
      username,
      lastName,
      firstName,
      middleInitial,
      status,
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

    // Hide modal and refresh table
    bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();
    await renderUsersTable(); // refresh updated list
    handleEditButtons(); // rebind buttons
  });

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
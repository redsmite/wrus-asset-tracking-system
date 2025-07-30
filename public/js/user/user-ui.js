import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { Users } from '../data/cache/user-data.js'
import { Spinner } from '../components/spinner.js';
import { Sidebar } from '../components/sidebar.js';
import { AdminGuard } from "../auth/auth.js";
import { NotificationBox } from "../components/notification.js";

let currentPage = 1;
const usersPerPage = 10;
let allUsers = [];

export function initializePage(){
  Sidebar.render();
  AdminGuard.verify();
  Spinner.render();
  loadUsers();
  initializeAddUserModal();
  handleRefreshButton({
    buttonId: "refreshBtn",
    refreshFn: Users.refreshCache.bind(Users),
    renderFn: () => renderUsersTable(1),
    cooldownKey: "lastUsersRefresh"
  });
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

  // Helper to normalize text (remove diacritics, lower case)
  function normalizeText(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Highlight match in original text
  function highlightMatch(text, query) {
    if (!query) return text;
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(query);
    const index = normalizedText.indexOf(normalizedQuery);
    if (index === -1) return text;

    const originalIndex = [...text].findIndex((_, i) =>
      normalizeText(text.slice(i)).startsWith(normalizedQuery)
    );

    return (
      text.slice(0, originalIndex) +
      "<mark>" + text.slice(originalIndex, originalIndex + query.length) + "</mark>" +
      text.slice(originalIndex + query.length)
    );
  }

  let filteredUsers = allUsers.filter(user => user.type && user.type.trim() !== "");

  if (searchQuery) {
    const normQuery = normalizeText(searchQuery);
    filteredUsers = filteredUsers.filter(user =>
      normalizeText(user.username || "").includes(normQuery) ||
      normalizeText(user.firstName || "").includes(normQuery) ||
      normalizeText(user.lastName || "").includes(normQuery)
    );
  }

  const start = (page - 1) * usersPerPage;
  const end = start + usersPerPage;
  const paginatedUsers = filteredUsers.slice(start, end);

  usersTableBody.innerHTML = "";

  paginatedUsers.forEach(user => {
    const username   = highlightMatch(user.username || '', searchQuery);
    const lastName   = highlightMatch(user.lastName || '', searchQuery);
    const firstName  = highlightMatch(user.firstName || '', searchQuery);
    const position   = user.position || '';
    const type       = user.type || '';

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${username}</td>
      <td>${lastName}</td>
      <td>${firstName}</td>
      <td>${position}</td>
      <td>${type}</td>
      <td>
        <button class="btn btn-3d btn-sm btn-outline-primary edit-btn" data-id="${user.id}">
          <i class="bi bi-pencil-square me-1"></i> Edit
        </button>
      </td>
    `;
    usersTableBody.appendChild(row);
  });

  initializeEditFunctionality();
  renderPaginationControls(Math.ceil(filteredUsers.length / usersPerPage), page, searchQuery);
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

  let originalText = refreshBtn.textContent;
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

  // On load, resume cooldown if within cooldown time
  const lastRefresh = parseInt(localStorage.getItem(cooldownKey)) || 0;
  const now = Date.now();
  const elapsed = now - lastRefresh;
  const cooldownMs = cooldownSeconds * 1000;

  if (elapsed < cooldownMs) {
    const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
    startCooldown(); // Resume countdown
  }

  refreshBtn.addEventListener("click", async () => {
    const now = Date.now();
    const lastRefresh = parseInt(localStorage.getItem(cooldownKey)) || 0;
    const cooldownMs = cooldownSeconds * 1000;

    if (now - lastRefresh < cooldownMs) {
      // Already handled by interval timer
      return;
    }

    try {
      await refreshFn();
      await Users.refreshCache();
      renderUsersTable();
      renderFn();
      NotificationBox.show("Refreshed successfully.");
      startCooldown();
    } catch (err) {
      console.error("Refresh error:", err);
      NotificationBox.show("Failed to refresh data.");
    }
  });
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

function renderPaginationControls(totalPages, currentPage, searchQuery = "") {
  const pagination = document.getElementById("paginationControlsUsers");
  pagination.innerHTML = "";

  if (totalPages <= 1) return; // No need to show pagination for 1 page

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const ul = document.createElement("ul");
  ul.className = "pagination justify-content-center";

  // Previous Button
  const prevItem = document.createElement("li");
  prevItem.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevItem.innerHTML = `
    <a class="page-link" href="#" aria-label="Previous">
      <span aria-hidden="true">&laquo;</span>
    </a>
  `;
  prevItem.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      renderUsersTable(currentPage - 1, searchQuery);
    }
  });
  ul.appendChild(prevItem);

  // Page Number Buttons
  for (let i = startPage; i <= endPage; i++) {
    const pageItem = document.createElement("li");
    pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageItem.addEventListener("click", (e) => {
      e.preventDefault();
      renderUsersTable(i, searchQuery);
    });
    ul.appendChild(pageItem);
  }

  // Next Button
  const nextItem = document.createElement("li");
  nextItem.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  nextItem.innerHTML = `
    <a class="page-link" href="#" aria-label="Next">
      <span aria-hidden="true">&raquo;</span>
    </a>
  `;
  nextItem.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      renderUsersTable(currentPage + 1, searchQuery);
    }
  });
  ul.appendChild(nextItem);

  pagination.appendChild(ul);
}

function handleSearchBar() {
  document.getElementById("searchInput").addEventListener("input", (e) => {
    const query = e.target.value.trim();
    currentPage = 1;
    renderUsersTable(currentPage, query);
  });
}
let currentPage = 1;
const rowsPerPage = 10;
let users = [];

document.addEventListener("DOMContentLoaded", () => {
  const showFormBtn = document.getElementById("showAddUserFormBtn");
  const addUserForm = document.getElementById("addUserForm");
  const passwordMismatch = document.getElementById("passwordMismatch");

  if (showFormBtn && addUserForm) {
    showFormBtn.addEventListener("click", () => {
      addUserForm.classList.toggle("d-none");
      passwordMismatch?.classList.add("d-none");
    });
  }

  fetchUsers();
});

document.addEventListener('openEditUserModal', (event) => {
  const userId = event.detail.userId;
  console.log('Edit user ID:', userId);

  const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
  editUserModal.show();
});

// Fetch users from Firestore
import { db } from "../firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const fetchUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  renderPagination();
  renderTable();
};

// Render paginated table
const renderTable = () => {
  const tableBody = document.getElementById("usersTableBody");
  tableBody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = users.slice(start, start + rowsPerPage);

  paginatedUsers.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.username || ""}</td>
      <td>${user.lastName || ""}</td>
      <td>${user.firstName || ""}</td>
      <td>${user.middleInitial || ""}</td>
      <td><button class="btn btn-sm btn-primary editBtn" data-id="${user.id}">Edit</button></td>
    `;
    tableBody.appendChild(row);
  });

  attachEditHandlers();
};

// Create pagination buttons
const renderPagination = () => {
  const paginationContainer = document.getElementById("paginationControls");
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(users.length / rowsPerPage);

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.className = "btn btn-sm btn-secondary me-2";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderTable();
    renderPagination();
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.className = "btn btn-sm btn-secondary ms-2";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderTable();
    renderPagination();
  };

  paginationContainer.appendChild(prevBtn);
  paginationContainer.appendChild(document.createTextNode(` Page ${currentPage} of ${totalPages} `));
  paginationContainer.appendChild(nextBtn);
};

// Attach click listeners to Edit buttons
const attachEditHandlers = () => {
  document.querySelectorAll(".editBtn").forEach(button => {
    button.addEventListener("click", () => {
      const userId = button.getAttribute("data-id");
      const event = new CustomEvent("openEditUserModal", { detail: { userId } });
      document.dispatchEvent(event);
    });
  });
};

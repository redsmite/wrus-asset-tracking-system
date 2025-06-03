import { db } from "../firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("usersTableBody");
  const searchInput = document.getElementById("searchInput");
  const editUserForm = document.getElementById("editUserForm");
  const paginationControls = document.getElementById("paginationControls");

  let users = [];
  let filteredUsers = [];
  let currentPage = 1;
  const rowsPerPage = 10;

  // Fetch all users
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    filteredUsers = [...users]; // initially show all
    currentPage = 1;
    renderTable();
    renderPagination();
  };

  // Render paginated table
  const renderTable = () => {
    tableBody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const paginatedUsers = filteredUsers.slice(start, start + rowsPerPage);

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

  // Render pagination controls
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    paginationControls.innerHTML = "";

    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "btn btn-sm btn-secondary me-2";
    prevBtn.textContent = "Previous";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      currentPage--;
      renderTable();
      renderPagination();
    };

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-sm btn-secondary ms-2";
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      currentPage++;
      renderTable();
      renderPagination();
    };

    const pageInfo = document.createElement("span");
    pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `;

    paginationControls.appendChild(prevBtn);
    paginationControls.appendChild(pageInfo);
    paginationControls.appendChild(nextBtn);
  };

  // Attach edit button click listeners
  const attachEditHandlers = () => {
    document.querySelectorAll(".editBtn").forEach(button => {
      button.addEventListener("click", async () => {
        const userId = button.getAttribute("data-id");
        const userDoc = await getDoc(doc(db, "users", userId));

        if (userDoc.exists()) {
          const user = userDoc.data();
          document.getElementById("editUserId").value = userId;
          document.getElementById("editUsername").value = user.username || "";
          document.getElementById("editLastName").value = user.lastName || "";
          document.getElementById("editFirstName").value = user.firstName || "";
          document.getElementById("editMiddleInitial").value = user.middleInitial || "";

          const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
          modal.show();
        } else {
          alert("User not found!");
        }
      });
    });
  };

  // Handle form submit for updates
  editUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userId = document.getElementById("editUserId").value;
    const updatedUser = {
      username: document.getElementById("editUsername").value.trim(),
      lastName: document.getElementById("editLastName").value.trim(),
      firstName: document.getElementById("editFirstName").value.trim(),
      middleInitial: document.getElementById("editMiddleInitial").value.trim(),
    };

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, updatedUser);

      bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();
      await fetchUsers(); // reload full list
      alert("User updated successfully.");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Update failed. See console for details.");
    }
  });

  // Search filter
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase().trim();
    filteredUsers = users.filter(user =>
      (user.username || "").toLowerCase().includes(value) ||
      (user.firstName || "").toLowerCase().includes(value) ||
      (user.lastName || "").toLowerCase().includes(value)
    );
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  // Initial load
  await fetchUsers();
});

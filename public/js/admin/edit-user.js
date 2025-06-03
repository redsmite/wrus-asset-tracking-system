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

  let users = [];

  // Fetch all users
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    renderTable(users);
  };

  // Render table
  const renderTable = (data) => {
    tableBody.innerHTML = "";
    data.forEach(user => {
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
    attachEditHandlers(); // Bind event handlers
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

      // Hide modal
      bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();

      // Refresh data
      await fetchUsers();
      alert("User updated successfully.");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Update failed. See console for details.");
    }
  });

  // Search filter
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase().trim();
    const filtered = users.filter(user =>
      (user.username || "").toLowerCase().includes(value) ||
      (user.firstName || "").toLowerCase().includes(value) ||
      (user.lastName || "").toLowerCase().includes(value)
    );
    renderTable(filtered);
  });

  // Initial load
  await fetchUsers();
});

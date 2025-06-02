import { db } from "./firebaseConfig.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Redirect to login if not authenticated
  const user = localStorage.getItem("loggedInUser");
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const tableBody = document.getElementById("consumableTableBody");
  const searchInput = document.getElementById("searchInput");

  async function loadData() {
    const querySnapshot = await getDocs(collection(db, "consumables"));
    const data = [];

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      data.push(item);
    });

    renderTable(data);

    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase();
      const filtered = data.filter(item =>
        item.specification?.toLowerCase().includes(searchTerm)
      );
      renderTable(filtered);
    });
  }

  function renderTable(items) {
    tableBody.innerHTML = "";
    items.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.cid || ""}</td>
        <td>${item.specification || ""}</td>
        <td>${item.qty || 0}</td>
        <td>${item.unit || ""}</td>
        <td>
          <button class="btn btn-outline-success btn-sm me-1 toggle-btn">+</button>
          <button class="btn btn-outline-danger btn-sm toggle-btn">−</button>
          <input type="number" class="form-control mt-2 action-input d-none" placeholder="Enter amount">
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Add toggle behavior after rendering
    document.querySelectorAll(".toggle-btn").forEach(button => {
      button.addEventListener("click", (e) => {
        const currentRow = e.target.closest("tr");
        const input = currentRow.querySelector(".action-input");

        // Hide all other inputs
        document.querySelectorAll(".action-input").forEach(i => {
          if (i !== input) i.classList.add("d-none");
        });

        // Toggle this input
        input.classList.toggle("d-none");
        if (!input.classList.contains("d-none")) {
          input.focus();
        }
      });
    });
  }

  loadData();

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  });
});
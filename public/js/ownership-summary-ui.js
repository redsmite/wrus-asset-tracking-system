import {
  fetchUsers,
  fetchConsumablesMap,
  fetchLedgerByUser,
} from "./ownership-summary-data.js";

// Logout logic (removes stored login info and redirects to login page)
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  });
}

const logoutBtnMobile = document.getElementById("logoutBtnMobile");
if (logoutBtnMobile) {
  logoutBtnMobile.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Fetch all users from Firestore
  const users = await fetchUsers(); 
  // users = [ { id, lastName, firstName, middleInitial }, … ]

  // 2) Grab references to DOM elements
  const tableBody = document.getElementById("usersTableBody");
  const searchInput = document.getElementById("searchInput");
  const pageContent = document.getElementById("page-content");

  // Create a container for pagination controls and append it under the table
  const paginationNav = document.createElement("nav");
  paginationNav.className = "d-flex justify-content-center mt-3";
  pageContent.appendChild(paginationNav);

  // 3) Initialize the Bootstrap modal instance
  const modalElement = document.getElementById("consumableModal");
  if (!modalElement) {
    console.error("Modal element #consumableModal not found in DOM!");
    return;
  }
  const bsModal = new bootstrap.Modal(modalElement);

  // 4) Pagination & filtering state
  const usersPerPage = 10;       // show 10 users per page
  let currentPage = 1;
  let filteredUsers = [...users]; // for search filtering

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER PAGINATION CONTROLS (Numbered + Previous/Next)
  // ────────────────────────────────────────────────────────────────────────────
  function renderPagination(totalPages) {
    paginationNav.innerHTML = ""; // clear existing controls

    const ul = document.createElement("ul");
    ul.className = "pagination";

    // Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    const prevBtn = document.createElement("button");
    prevBtn.className = "page-link";
    prevBtn.textContent = "Previous";
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    };
    prevLi.appendChild(prevBtn);
    ul.appendChild(prevLi);

    // Numbered page buttons
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === currentPage ? "active" : ""}`;
      const btn = document.createElement("button");
      btn.className = "page-link";
      btn.textContent = i;
      btn.onclick = () => {
        currentPage = i;
        renderTable();
      };
      li.appendChild(btn);
      ul.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${
      currentPage === totalPages ? "disabled" : ""
    }`;
    const nextBtn = document.createElement("button");
    nextBtn.className = "page-link";
    nextBtn.textContent = "Next";
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    };
    nextLi.appendChild(nextBtn);
    ul.appendChild(nextLi);

    paginationNav.appendChild(ul);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER USERS TABLE (with “View Consumable” and “View ICS” buttons)
  // ────────────────────────────────────────────────────────────────────────────
  function renderTable() {
    tableBody.innerHTML = ""; // clear existing rows

    // Determine which users to show on current page
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const pageUsers = filteredUsers.slice(startIndex, endIndex);

    pageUsers.forEach((user) => {
      const row = document.createElement("tr");

      // Column 1: Full Name
      const nameCell = document.createElement("td");
      nameCell.textContent = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
      row.appendChild(nameCell);

      // Column 2: View Consumable button
      const consumableCell = document.createElement("td");
      const consumableBtn = document.createElement("button");
      consumableBtn.textContent = "View Consumable";
      consumableBtn.className = "btn btn-success golden-button";
      consumableBtn.setAttribute("data-id", user.id); // store Firestore doc ID

      // Attach click handler to open modal and fetch data
      consumableBtn.addEventListener("click", async () => {
        // a) Retrieve the user’s document ID from data-id
        const docId = consumableBtn.getAttribute("data-id");

        // b) Find the matching user object to get their name
        const matchedUser = users.find((u) => u.id === docId);
        if (!matchedUser) {
          console.error(`User with ID="${docId}" not found.`);
          return;
        }
        const fullName = `${matchedUser.lastName}, ${matchedUser.firstName} ${matchedUser.middleInitial}.`;

        // c) Update modal header title
        const modalTitle = document.getElementById("consumableModalLabel");
        modalTitle.textContent = `Consumable for ${fullName}`;

        // d) Clear modal-body and inject the user’s name + table skeleton
        const modalBody = modalElement.querySelector(".modal-body");
        modalBody.innerHTML = ""; // remove “Loading…” or prior contents

        // Insert user’s full name as an <h5> in modal body
        const heading = document.createElement("h5");
        heading.className = "mb-3";
        heading.textContent = fullName;
        modalBody.appendChild(heading);

        // Insert a responsive table skeleton with thead (CID | Specification | Unit | Qty) and empty tbody
        const tableWrapper = document.createElement("div");
        tableWrapper.className = "table-responsive";
        tableWrapper.innerHTML = `
          <table class="table table-bordered table-striped">
            <thead class="table-light">
              <tr>
                <th>CID</th>
                <th>Specification</th>
                <th>Unit</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody id="consumable-table-body">
              <!-- Rows will be appended here after fetching Firestore data -->
            </tbody>
          </table>
        `;
        modalBody.appendChild(tableWrapper);

        // e) Fetch consumable lookup map and ledger entries for this user in parallel
        const [consumablesMap, ledgerEntries] = await Promise.all([
          fetchConsumablesMap(),
          fetchLedgerByUser(user.id),
        ]);

        // f) Group ledger entries by CID and sum amounts
        const qtyByCID = {};
        ledgerEntries.forEach(({ cid, amount }) => {
          if (!cid) return; // skip if no CID
          if (!qtyByCID[cid]) qtyByCID[cid] = 0;
          qtyByCID[cid] += amount;
        });

        // g) Populate the table body with one row per CID
        const tbody = document.getElementById("consumable-table-body");
        tbody.innerHTML = ""; // clear any placeholder

        Object.entries(qtyByCID).forEach(([cid, totalQty]) => {
          // Lookup specification and unit in the consumablesMap
          const spec = consumablesMap[cid]?.specification || "–";
          const unit = consumablesMap[cid]?.unit || "–";

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${cid}</td>
            <td>${spec}</td>
            <td>${unit}</td>
            <td>${totalQty}</td>
          `;
          tbody.appendChild(tr);
        });

        // h) Show the modal
        bsModal.show();
      });

      consumableCell.appendChild(consumableBtn);
      row.appendChild(consumableCell);

      // Column 3: View ICS button (no functionality yet)
      const icsCell = document.createElement("td");
      const icsBtn = document.createElement("button");
      icsBtn.textContent = "View ICS";
      icsBtn.className = "btn btn-info golden-button";
      icsBtn.setAttribute("data-id", user.id);
      icsCell.appendChild(icsBtn);
      row.appendChild(icsCell);

      tableBody.appendChild(row);
    });

    // After adding all rows, render pagination controls
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    renderPagination(totalPages);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SEARCH FILTER: Filters `users` by name whenever the search input changes
  // ────────────────────────────────────────────────────────────────────────────
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    filteredUsers = users.filter((u) => {
      const fullName = `${u.lastName}, ${u.firstName} ${u.middleInitial}`.toLowerCase();
      return fullName.includes(query);
    });
    currentPage = 1; // reset to first page on new search
    renderTable();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // INITIAL RENDER: Display the first page of users
  // ────────────────────────────────────────────────────────────────────────────
  renderTable();
});
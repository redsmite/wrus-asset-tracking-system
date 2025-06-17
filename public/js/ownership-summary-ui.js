import {
  fetchUsers,
  fetchConsumablesMap,
  fetchLedgerByUser,
  generateConsumablePDF
} from "./ownership-summary-data.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Initial data fetch
  const users = await fetchUsers(); 
  const usersPerPage = 10;
  let currentPage = 1;
  let filteredUsers = [...users];

  //logout button
  function setupLogoutButtons() {
  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  };

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  const logoutBtnMobile = document.getElementById("logoutBtnMobile");
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener("click", handleLogout);
  }
}

  // DOM references
  const tableBody = document.getElementById("usersTableBody");
  const searchInput = document.getElementById("searchInput");
  const pageContent = document.getElementById("page-content");
  const modalElement = document.getElementById("consumableModal");
  if (!modalElement) {
    console.error("Modal element #consumableModal not found in DOM!");
    return;
  }
  const bsModal = new bootstrap.Modal(modalElement);

  const paginationNav = document.createElement("nav");
  paginationNav.className = "d-flex justify-content-center mt-3";
  pageContent.appendChild(paginationNav);

  // Pagination Renderer
  function renderPagination(totalPages) {
    paginationNav.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "pagination";

    const addPageItem = (text, isDisabled, onClick, isActive = false) => {
      const li = document.createElement("li");
      li.className = `page-item ${isDisabled ? "disabled" : ""} ${isActive ? "active" : ""}`;
      const btn = document.createElement("button");
      btn.className = "page-link";
      btn.textContent = text;
      btn.onclick = onClick;
      li.appendChild(btn);
      ul.appendChild(li);
    };

    addPageItem("Previous", currentPage === 1, () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });

    for (let i = 1; i <= totalPages; i++) {
      addPageItem(i, false, () => {
        currentPage = i;
        renderTable();
      }, i === currentPage);
    }

    addPageItem("Next", currentPage === totalPages, () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });

    paginationNav.appendChild(ul);
  }

  // Search Handler
  function setupSearchHandler() {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      filteredUsers = users.filter((u) => {
        const fullName = `${u.lastName}, ${u.firstName} ${u.middleInitial}`.toLowerCase();
        return fullName.includes(query);
      });
      currentPage = 1;
      renderTable();
    });
  }

  // Consumable Button Handler
  function setupConsumableButton(button, user) {
    button.addEventListener("click", async () => {
      const [consumablesMap, ledgerEntries] = await Promise.all([
        fetchConsumablesMap(),
        fetchLedgerByUser(user.id),
      ]);

      ledgerEntries.sort((a, b) => {
      if (!a.dateModified) return 1;
      if (!b.dateModified) return -1;
      return b.dateModified.toMillis() - a.dateModified.toMillis();
    });

      console.log(ledgerEntries);
      await generateConsumablePDF(user, ledgerEntries, consumablesMap);
      bsModal.show();
    });
  }

  // Table Renderer
  function renderTable() {
    tableBody.innerHTML = "";

    const startIndex = (currentPage - 1) * usersPerPage;
    const pageUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

    pageUsers.forEach((user) => {
      const row = document.createElement("tr");

      // Full Name
      const nameCell = document.createElement("td");
      nameCell.textContent = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
      row.appendChild(nameCell);

      // View Consumable Button
      const consumableCell = document.createElement("td");
      const consumableBtn = document.createElement("button");
      consumableBtn.textContent = "View Consumable";
      consumableBtn.className = "btn btn-success golden-button";
      consumableBtn.setAttribute("data-id", user.id);
      setupConsumableButton(consumableBtn, user);
      consumableCell.appendChild(consumableBtn);
      row.appendChild(consumableCell);

      // View ICS Button (placeholder)
      const icsCell = document.createElement("td");
      const icsBtn = document.createElement("button");
      icsBtn.textContent = "View ICS";
      icsBtn.className = "btn btn-info golden-button";
      icsBtn.setAttribute("data-id", user.id);
      icsCell.appendChild(icsBtn);
      row.appendChild(icsCell);

      tableBody.appendChild(row);
    });

    renderPagination(Math.ceil(filteredUsers.length / usersPerPage));
  }

  // Initialize
  setupLogoutButtons();
  setupSearchHandler();
  renderTable();
});
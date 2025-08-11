import { generatePdfICS } from "../pdf/ics-pdf.js";
import { generateConsumablePDF } from "../pdf/user-consumable-pdf.js"
import { Consumable } from "../data/cache/consumable-data.js";
import { Ledger } from "../data/cache/ledger-data.js";
import { ICS } from "../data/cache/ics-data.js";
import { Users } from "../data/cache/user-data.js";
import { Sidebar } from '../components/sidebar.js';
import { Spinner } from '../components/spinner.js';

// Global variables
let users = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 10;

// INIT FUNCTIONS
let tableBody, searchInput, pageContent, paginationNav, modalElement, bsModal;

export function initDOMElements() {
  tableBody = document.getElementById("usersTableBody");
  searchInput = document.getElementById("searchInput");
  pageContent = document.getElementById("page-content");
  modalElement = document.getElementById("consumableModal");

  if (!modalElement) {
    console.error("Modal element #consumableModal not found!");
    return;
  }

  bsModal = new bootstrap.Modal(modalElement);

  paginationNav = document.createElement("nav");
  paginationNav.className = "d-flex justify-content-center mt-3";
  pageContent.appendChild(paginationNav);
}

export function initUI() {
  Sidebar.render();
  Spinner.render();
  hideSearchIfNotAdmin();
  setupSearchHandler();
  setupGenerateICSHandler();
  renderLatestLedger();
  renderCriticalLowSupplyChart("lowSupplyChartContainer");
  renderLedgerCharts();
}

export async function loadData() {
  Spinner.show();
  try {
    users = await Users.fetchUsersSummary();
    filteredUsers = [...users];
  } finally {
    Spinner.hide();
  }
}

function setupSearchHandler() {
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    filteredUsers = users.filter(u => {
      const fullName = `${u.lastName}, ${u.firstName} ${u.middleInitial}`.toLowerCase();
      return fullName.includes(query);
    });
    currentPage = 1;
    renderTable();
  });
}

function hideSearchIfNotAdmin() {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "admin") {
    searchInput?.style.setProperty("display", "none");
  }
}

export function renderTable() {
  Spinner.show();
  try {
    tableBody.innerHTML = "";

    const currentUserId = localStorage.getItem("wrusUserId");
    const isAdmin = currentUserId === "admin";

    const visibleUsers = isAdmin
      ? filteredUsers
      : filteredUsers.filter(user =>
          user.id === currentUserId || (!user.type || user.type.trim() === '')
        );

    const start = (currentPage - 1) * usersPerPage;
    const pageUsers = visibleUsers.slice(start, start + usersPerPage);

    pageUsers.forEach(user => {
      const row = document.createElement("tr");
      row.appendChild(createNameCell(user));
      row.appendChild(createConsumableCell(user));
      row.appendChild(createICSCell(user));
      tableBody.appendChild(row);
    });

    renderPagination(Math.ceil(visibleUsers.length / usersPerPage));
  } finally {
    Spinner.hide();
  }
}

function createNameCell(user) {
  const cell = document.createElement("td");
  cell.textContent = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
  cell.classList.add("fw-medium", "text-capitalize");
  return cell;
}

function createConsumableCell(user) {
  const cell = document.createElement("td");
  cell.classList.add("text-center");

  const btn = document.createElement("button");
  btn.className = "btn btn-3d btn-water btn-sm px-2 py-1 fw-semibold rounded";
  btn.innerHTML = `<i class="bi bi-box-arrow-in-down me-1"></i>Consumable`;
  btn.setAttribute("data-id", user.id);

  btn.addEventListener("click", async () => {
    Spinner.show();
    try {
      const [consumablesMap, ledgerEntries] = await Promise.all([
        Consumable.fetchConsumablesMap(),
        Ledger.fetchLedgerByUser(user.id)
      ]);

      ledgerEntries.sort((a, b) => (b.dateModified?.toMillis() || 0) - (a.dateModified?.toMillis() || 0));

      await generateConsumablePDF(user, ledgerEntries, consumablesMap);
      bsModal.show();
    } finally {
      Spinner.hide();
    }
  });

  cell.appendChild(btn);
  return cell;
}

function createICSCell(user) {
  const cell = document.createElement("td");
  cell.classList.add("text-center");

  if (user.type !== "Permanent") {
    return cell;
  }

  const btn = document.createElement("button");
  btn.className = "btn btn-3d btn-water-alt btn-sm px-2 py-1 fw-semibold rounded";
  btn.innerHTML = `<i class="bi bi-card-list me-1"></i>ICS`;
  btn.setAttribute("data-id", user.id);

  btn.addEventListener("click", () => {
    showPropertyModal({
      lastName: user.lastName,
      firstName: user.firstName,
      middleInitial: user.middleInitial
    }, user.id);
  });

  cell.appendChild(btn);
  return cell;
}

function renderPagination(totalPages) {
  const paginationNav = document.getElementById("paginationNav");
  if (!paginationNav) {
    console.warn("Pagination container #paginationNav not found");
    return;
  }

  paginationNav.innerHTML = "";
  const ul = document.createElement("ul");
  ul.className = "pagination";

  const addItem = (label, disabled, onClick, active = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;

    const btn = document.createElement("button");
    btn.className = "page-link";
    btn.textContent = label;
    btn.onclick = onClick;

    li.appendChild(btn);
    ul.appendChild(li);
  };

  addItem("Previous", currentPage === 1, () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + 4;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    addItem(i, false, () => {
      currentPage = i;
      renderTable();
    }, i === currentPage);
  }

  addItem("Next", currentPage === totalPages, () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  paginationNav.appendChild(ul);
}

async function showPropertyModal(userFullName, userId) {
  document.getElementById("fullName").textContent =
    `${userFullName.lastName}, ${userFullName.firstName} ${userFullName.middleInitial}.`;

  const generateBtn = document.getElementById("generatePdfBtn");
  generateBtn.dataset.userid = userId;

  const icsTableBody = document.getElementById("icsTableBody");
  const totalAmountSpan = document.getElementById("totalAmount");

  icsTableBody.innerHTML = "";
  totalAmountSpan.textContent = "₱0.00";

  const allICSItems = await ICS.getICSDataByUserId(userId);
  const icsItems = allICSItems.filter(item => item.status !== 'RTS');

  let totalAmount = 0;
  icsItems.forEach(item => {
    totalAmount += item.totalCost;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.qty}</td>
      <td>${item.unit}</td>
      <td>${item.description}</td>
      <td>${item.serialNo}</td>
      <td>₱${item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td>₱${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td>${item.ICSno}</td>
      <td>${item.dateIssued}</td>
      <td>${item.remarks}</td>
      <td>
        ${item.attachmentURL
          ? `<a href="${item.attachmentURL}" target="_blank" class="btn btn-3d btn-sm btn-outline-primary">View PDF</a>`
          : '<span class="text-muted">N/A</span>'}
      </td>
    `;
    icsTableBody.appendChild(row);
  });

  totalAmountSpan.textContent = `₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const modal = new bootstrap.Modal(document.getElementById("propertyModal"));
  modal.show();
}

function setupGenerateICSHandler() {
  document.getElementById("generatePdfBtn")?.addEventListener("click", () => {
    const userId = document.getElementById("generatePdfBtn").dataset.userid;
    if (userId) {
      generatePdfICS(userId);
    }
  });
}

async function renderLatestLedger(containerId = "ledgerContainer") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found.`);
    return;
  }

  Spinner.show();

  try {
    container.innerHTML = "<p>Loading latest ledger entries...</p>";

    let ledgerEntries = await Ledger.fetchAll();
    ledgerEntries = ledgerEntries.slice(0, 10);

    if (ledgerEntries.length === 0) {
      container.innerHTML = "<p>No ledger entries found.</p>";
      return;
    }

    const consumableMap = await Consumable.fetchConsumablesMap();
    const usersMap = await Users.getUsersMap();

    container.innerHTML = "";

    // Header
    const header = document.createElement("h5");
    header.textContent = "Latest Ledger Report";
    header.className = "mb-4";
    container.appendChild(header);

    // Responsive wrapper
    const responsiveWrapper = document.createElement("div");
    responsiveWrapper.className = "table-responsive";
    container.appendChild(responsiveWrapper);

    // Table
    const table = document.createElement("table");
    table.className = "table table-striped table-bordered table-hover align-middle";

    // Table header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr class="text-center align-middle">
        <th scope="col">Date Modified</th>
        <th scope="col">Consumable</th>
        <th scope="col">Action</th>
        <th scope="col" class="text-end">Amount</th>
        <th scope="col">Remarks</th>
        <th scope="col">Assigned To</th>
      </tr>
    `;
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement("tbody");

    for (const entry of ledgerEntries) {
      const consumableSpec = consumableMap[entry.cid]?.specification || entry.cid;

      let dateStr = "N/A";
      if (entry.dateModified) {
        if (entry.dateModified.seconds) {
          dateStr = new Date(entry.dateModified.seconds * 1000).toLocaleString();
        } else if (entry.dateModified.toDate) {
          dateStr = entry.dateModified.toDate().toLocaleString();
        } else if (entry.dateModified instanceof Date) {
          dateStr = entry.dateModified.toLocaleString();
        } else {
          dateStr = String(entry.dateModified);
        }
      }

      const assignedToUsername = entry.assignedTo && usersMap[entry.assignedTo]
        ? usersMap[entry.assignedTo]
        : entry.assignedTo || "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-center">${dateStr}</td>
        <td>${consumableSpec}</td>
        <td class="text-center">${entry.action || ""}</td>
        <td class="text-end">${entry.amount ?? ""}</td>
        <td>${entry.remarks || ""}</td>
        <td>${assignedToUsername}</td>
      `;
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    responsiveWrapper.appendChild(table);

  } catch (error) {
    console.error("Error rendering latest ledger:", error);
    if (container) container.innerHTML = "<p>Error loading ledger data.</p>";
  } finally {
    Spinner.hide();
  }
}

async function renderCriticalLowSupplyChart(containerId = "chartsContainer") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found.`);
    return;
  }

  Spinner.show();

  try {
    const consumables = await Consumable.fetchAll();

    // Filter all consumables with qty <= 10, sorted ascending
    const criticalItems = consumables
      .filter(item => item.qty <= 10)
      .sort((a, b) => a.qty - b.qty);

    if (criticalItems.length === 0) {
      container.innerHTML = "<p>No critically low supply items found.</p>";
      return;
    }

    const labels = criticalItems.map(item => item.specification || item.id);
    const data = criticalItems.map(item => item.qty);

    // Clear previous canvas and list if exists
    let oldCanvas = document.getElementById("chartCriticalLowSupply");
    if (oldCanvas) container.removeChild(oldCanvas);
    let oldList = document.getElementById("criticalLowSupplyList");
    if (oldList) container.removeChild(oldList);

    // Create canvas for chart
    const canvas = document.createElement("canvas");
    canvas.id = "chartCriticalLowSupply";
    canvas.style.marginBottom = "1rem";
    container.appendChild(canvas);

    // Create horizontal bar chart
    new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Qty",
          data,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: 'y', // horizontal bar chart
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Critically Low Consumable Supplies (Qty <= 10)" },
        },
      },
    });
  } catch (error) {
    console.error("Error rendering critical low supply chart:", error);
  } finally {
    Spinner.hide();
  }
}

async function renderLedgerCharts() {
  const chartContainer = document.getElementById('chartsContainer');
  if (!chartContainer) {
    console.error('Container with ID "chartsContainer" not found.');
    return;
  }

  Spinner.show();

  try {
    const ledgerEntries = await Ledger.fetchAll();
    const consumableMap = await Consumable.fetchConsumablesMap();

    // Helper to group by CID
    const groupByCID = (entries) => {
      const grouped = {};
      for (const entry of entries) {
        const name = consumableMap[entry.cid]?.specification || entry.cid;
        grouped[name] = (grouped[name] || 0) + (entry.amount || 0);
      }
      return grouped;
    };

    const entriesByYear = {};
    for (const entry of ledgerEntries) {
      if (!entry.dateModified) continue;
      const year = new Date(entry.dateModified.seconds * 1000).getFullYear();
      if (!entriesByYear[year]) entriesByYear[year] = [];
      entriesByYear[year].push(entry);
    }

    chartContainer.innerHTML = '';

    const createBarChart = (ctx, label, labels, data) => {
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label,
            data,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          },
          responsive: true,
          plugins: {
            legend: { display: true, position: 'top' },
            title: { display: true, text: label }
          }
        }
      });
    };

    for (const year of Object.keys(entriesByYear).sort((a, b) => b - a)) {
      const assignItemEntries = entriesByYear[year].filter(
        e => e.action?.toLowerCase() === 'assign item'
      );

      const grouped = groupByCID(assignItemEntries);
      const sortedEntries = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      const labels = sortedEntries.map(([name]) => name);
      const data = sortedEntries.map(([, amount]) => amount);

      const canvas = document.createElement('canvas');
      canvas.id = `chartAssignItem_${year}`;
      canvas.style.marginBottom = '2rem';
      chartContainer.appendChild(canvas);

      createBarChart(canvas, `Most Used Consumables - ${year}`, labels, data);
    }
  } catch (error) {
    console.error("Error rendering ledger charts:", error);
  } finally {
    Spinner.hide();
  }
}





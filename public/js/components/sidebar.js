export function renderSidebar(containerId = 'sidebarContainer') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Sidebar container with ID "${containerId}" not found.`);
    return;
  }

  container.innerHTML = `
    <!-- Toggle Button for Small Screens -->
    <button class="btn btn-primary m-2 d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasSidebar" aria-controls="offcanvasSidebar">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="d-flex" id="wrapper">
      <!-- Sidebar for md and up -->
      <div class="bg-primary text-white p-3 vh-100 d-none d-md-block" id="sidebar">
        <h4 class="mb-4">WRUS Asset Tracking System</h4>
        <ul class="nav flex-column">
          <li class="nav-item mb-2"><a href="dashboard.html" class="nav-link text-white">Dashboard</a></li>
          <li class="nav-item mb-2"><a href="consumable.html" class="nav-link text-white">Consumable</a></li>
          <li class="nav-item mb-2"><a href="ics.html" class="nav-link text-white">ICS</a></li>
          <li class="nav-item mb-2"><a href="ownership-summary.html" class="nav-link text-white">Inventory Summary</a></li>
        </ul>
        <button id="logoutBtn" class="btn btn-light mt-auto">Logout</button>
      </div>

      <!-- Offcanvas Sidebar -->
      <div class="offcanvas offcanvas-start text-bg-primary" tabindex="-1" id="offcanvasSidebar" aria-labelledby="offcanvasSidebarLabel">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title" id="offcanvasSidebarLabel">WRUS Asset Tracking System</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <ul class="nav flex-column">
            <li class="nav-item mb-2"><a href="dashboard.html" class="nav-link text-white">Dashboard</a></li>
            <li class="nav-item mb-2"><a href="consumable.html" class="nav-link text-white">Consumable</a></li>
            <li class="nav-item mb-2"><a href="ics.html" class="nav-link text-white">ICS</a></li>
            <li class="nav-item mb-2"><a href="ownership-summary.html" class="nav-link text-white">Inventory Summary</a></li>
          </ul>
          <button id="logoutBtnMobile" class="btn btn-light mt-auto">Logout</button>
        </div>
      </div>
    </div>
  `;
}

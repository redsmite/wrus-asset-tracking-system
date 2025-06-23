export function renderSidebar(containerId = 'sidebarContainer') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Sidebar container with ID "${containerId}" not found.`);
    return;
  }

  container.innerHTML = `
    <!-- TOGGLE BUTTON: Visible only on small screens -->
    <nav class="navbar bg-light d-md-none">
      <div class="container-fluid">
        <button class="btn btn-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebar" aria-controls="sidebar">
          <i class="bi bi-list"></i> Menu
        </button>
      </div>
    </nav>

    <div id="sidebar"
        class="offcanvas-md offcanvas-start bg-primary text-white p-3 vh-100"
        tabindex="-1"
        aria-labelledby="sidebarLabel">

      <!-- Header: only visible on small screens -->
      <div class="offcanvas-header d-md-none">
        <h5 class="offcanvas-title" id="sidebarLabel">WRUS Asset Tracking System</h5>
      </div>

      <!-- Body: always visible -->
      <div class="offcanvas-body d-flex flex-column">
        <h4 class="mb-4 d-none d-md-block">WRUS Asset Tracking System</h4>
        <ul class="nav flex-column mb-auto">
          <li class="nav-item mb-2">
            <a href="dashboard.html" class="nav-link text-white">Dashboard</a>
          </li>
          <li class="nav-item mb-2">
            <a href="consumable.html" class="nav-link text-white">Consumable</a>
          </li>
          <li class="nav-item mb-2">
            <a href="ics.html" class="nav-link text-white">ICS</a>
          </li>
          <li class="nav-item mb-2">
            <a href="ownership-summary.html" class="nav-link text-white">Inventory Summary</a>
          </li>
        </ul>
        <button id="logoutBtn" class="btn btn-light mt-auto">
          <i class="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </div>
    </div>
  `;
}

export function renderAdminSidebar() {
  const sidebarHTML = `
    <!-- Toggle Button for Small Screens -->
    <button class="btn btn-primary m-2 d-md-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasSidebar" aria-controls="offcanvasSidebar">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="d-flex" id="wrapper">
      <!-- Sidebar for md and up -->
      <div class="bg-primary text-white p-3 vh-100 d-none d-md-block" id="sidebar">
        <h4 class="mb-4">WRUS Asset Tracking System</h4>
        <ul class="nav flex-column">
          <li class="nav-item mb-2">
            <a href="admin-dashboard.html" class="nav-link text-white">Dashboard</a>
          </li>
          <li class="nav-item mb-2">
            <a href="user-management.html" class="nav-link text-white">User Management</a>
          </li>
        </ul>
        <button id="logoutBtn" class="btn btn-light mt-auto">
          <i class="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </div>

      <!-- Offcanvas Sidebar for smaller screens -->
      <div class="offcanvas offcanvas-start text-bg-primary" tabindex="-1" id="offcanvasSidebar" aria-labelledby="offcanvasSidebarLabel">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title" id="offcanvasSidebarLabel">WRUS Asset Tracking System</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <ul class="nav flex-column">
            <li class="nav-item mb-2">
              <a href="admin-dashboard.html" class="nav-link text-white">Dashboard</a>
            </li>
            <li class="nav-item mb-2">
              <a href="user-management.html" class="nav-link text-white">User Management</a>
            </li>
          </ul>
          <button id="logoutBtnMobile" class="btn btn-light mt-auto">
            <i class="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('sidebarContainer').innerHTML = sidebarHTML;
}

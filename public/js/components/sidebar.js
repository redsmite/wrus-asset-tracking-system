export const Sidebar = {
  render(containerId = 'sidebarContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Sidebar container with ID "${containerId}" not found.`);
      return;
    }

    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'admin';

    container.innerHTML = `
      <!-- Mobile Navbar -->
      <nav class="navbar bg-light d-md-none">
        <div class="container-fluid">
          <button class="btn water-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebar" aria-controls="sidebar">
            <i class="bi bi-list"></i> Menu
          </button>
        </div>
      </nav>

      <!-- Sidebar -->
      <div id="sidebar"
          class="offcanvas-md offcanvas-start bg-primary text-white p-3 vh-100"
          tabindex="-1"
          aria-labelledby="sidebarLabel">

        <div class="offcanvas-header d-md-none">
          <h5 class="offcanvas-title" id="sidebarLabel">WRUS Portal</h5>
        </div>

        <div class="offcanvas-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="d-none d-md-block m-0">WRUS Portal</h4>
            <!-- Desktop Toggle Button -->
            <button id="sidebarToggle" class="btn water-btn-outline d-none d-md-block">
              <i class="bi bi-chevron-left"></i>
            </button>
          </div>

          <ul class="nav flex-column mb-auto">
            <li class="nav-item mb-2">
              <a href="${isAdmin ? 'admin-dashboard.html' : 'dashboard.html'}" class="nav-link text-white">
                <i class="bi bi-speedometer2 me-2"></i> Dashboard
              </a>
            </li>

            ${isAdmin ? `
            <li class="nav-item mb-2">
              <a href="user-management.html" class="nav-link text-white">
                <i class="bi bi-people me-2"></i> User Management
              </a>
            </li>
            ` : ''}

            <li class="nav-item mb-2">
              <a class="nav-link text-white" data-bs-toggle="collapse" href="#assetMenu" role="button">
                <i class="bi bi-box-seam me-2"></i> Asset Inventory System
              </a>
              <div class="collapse ps-3" id="assetMenu">
                <ul class="nav flex-column">
                  <li><a class="nav-link text-white" href="consumable.html">Consumable</a></li>
                  <li><a class="nav-link text-white" href="ics.html">ICS</a></li>
                  <li><a class="nav-link text-white" href="inventory-summary.html">Inventory Summary</a></li>
                </ul>
              </div>
            </li>

            <li class="nav-item mb-2">
              <a class="nav-link text-white" data-bs-toggle="collapse" href="#waterMenu" role="button">
                <i class="bi bi-droplet-half me-2"></i> Water Inventory System
              </a>
              <div class="collapse ps-3" id="waterMenu">
                <ul class="nav flex-column">
                  <li><a class="nav-link text-white" href="permit.html">Water Permit</a></li>
                  <li><a class="nav-link text-white" href="water-user.html">Water Users and Sources</a></li>
                  <li><a class="nav-link text-white" href="report.html">Accomplishment Report</a></li>
                  <li><a class="nav-link text-white" href="map.html">Map Generator</a></li>
                </ul>
              </div>
            </li>
          </ul>

          <button id="logoutBtn" class="btn water-btn-outline mt-auto">
            <i class="bi bi-box-arrow-right me-2"></i> Logout
          </button>
        </div>
      </div>
    `;

    // Initialize Offcanvas
    this.initializeOffcanvas();

    // Logout Functionality
    const logoutBtn = container.querySelector('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        const keysToRemove = [
          'userRole',
          'loggedInUser',
          'wrusUserId',
          'userFullName',
          'userType'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        window.location.href = 'index.html';
      });
    }

    // Toggle Sidebar (Desktop)
    const sidebarToggle = container.querySelector('#sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const wrapper = document.getElementById('wrapper');
        wrapper.classList.toggle('sidebar-collapsed');
      });
    }
  },

  initializeOffcanvas() {
    if (typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
      const sidebarElement = document.getElementById('sidebar');
      if (sidebarElement) {
        bootstrap.Offcanvas.getOrCreateInstance(sidebarElement);
      }
    }
  }
};

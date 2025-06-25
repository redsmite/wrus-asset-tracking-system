export const Sidebar = {
  render(containerId = 'sidebarContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Sidebar container with ID "${containerId}" not found.`);
      return;
    }

    // ✔️ Get user role from localStorage
    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'admin';

    const links = isAdmin
      ? [
          { href: 'admin-dashboard.html', label: 'Dashboard' },
          { href: 'user-management.html', label: 'User Management' },
          { href: 'consumable.html', label: 'Consumable' },
          { href: 'ics.html', label: 'ICS' },
          { href: 'ownership-summary.html', label: 'Inventory Summary' },
        ]
      : [
          { href: 'dashboard.html', label: 'Dashboard' },
          { href: 'consumable.html', label: 'Consumable' },
          { href: 'ics.html', label: 'ICS' },
          { href: 'ownership-summary.html', label: 'Inventory Summary' },
        ];

    const linkItems = links
      .map(
        (link) => `
        <li class="nav-item mb-2">
          <a href="${link.href}" class="nav-link text-white">${link.label}</a>
        </li>
      `
      )
      .join('');

    container.innerHTML = `
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

        <div class="offcanvas-header d-md-none">
          <h5 class="offcanvas-title" id="sidebarLabel">WRUS Asset Tracking System</h5>
        </div>

        <div class="offcanvas-body d-flex flex-column">
          <h4 class="mb-4 d-none d-md-block">WRUS Asset Tracking System</h4>
          <ul class="nav flex-column mb-auto">
            ${linkItems}
          </ul>
          <button id="logoutBtn" class="btn btn-light mt-auto">
            <i class="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </div>
    `;

    // ✔️ Logout button handler
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
  },
};

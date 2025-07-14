// dashboard-ui.js

export function displayWelcomeText() {
  const welcomeText = document.getElementById("welcomeText");
  const positionText = document.getElementById("userPositionText");

  const userId = localStorage.getItem('wrusUserId');
  const cachedUsers = localStorage.getItem("cachedUsers");

  if (!userId || !cachedUsers) return;

  const users = JSON.parse(cachedUsers);
  const currentUser = users.find(user => user.id === userId);

  if (!currentUser) return;

  const fullName = `${currentUser.firstName} ${currentUser.middleInitial ? currentUser.middleInitial + '.' : ''} ${currentUser.lastName}`.trim();
  const position = currentUser.position || "";
  const type = currentUser.type || "";

  if (welcomeText) {
    welcomeText.textContent = `Welcome ${fullName}`;
  }

  if (positionText) {
    positionText.innerHTML = `
      <span class="fw-semibold text-primary">${position}</span>
      <span class="badge bg-secondary">${type}</span>
    `;
  }
}

export function showAnnouncementModal(message) {
  // Check if modal already exists to avoid duplicates
  if (!document.getElementById('announcementModal')) {
    const modalHTML = `
      <div class="modal fade" id="announcementModal" tabindex="-1" aria-labelledby="announcementModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="announcementModalLabel">📢 Announcement</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p id="announcementMessage">${message}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  } else {
    // If it exists, just update the message
    document.getElementById('announcementMessage').innerHTML = message;
  }

  // Show the modal
  const modalElement = document.getElementById('announcementModal');
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

export function updateDateTime() {
  const now = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  const dateElement = document.getElementById('date');
  const timeElement = document.getElementById('time');

  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString(undefined, dateOptions);
  }

  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString();
  }
}

export function renderEncodedPermitsTable(monthlyCounts) {
  const table = document.getElementById('encodedPermitTable');
  const message = document.getElementById('noEncodedMessage');
  const tbody = document.getElementById('encodedPermitTableBody');

  tbody.innerHTML = '';

  if (Object.keys(monthlyCounts).length === 0) {
    table.classList.add('d-none');
    message.classList.remove('d-none');
    return;
  }

  table.classList.remove('d-none');
  message.classList.add('d-none');

  Object.entries(monthlyCounts).forEach(([month, count]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${month}</td><td>${count}</td>`;
    tbody.appendChild(tr);
  });
}

export function displayWeather(description, temp) {
  const weatherElement = document.getElementById('weather');
  const tempElement = document.getElementById('temperature');

  if (weatherElement) weatherElement.textContent = description;
  if (tempElement) tempElement.textContent = `${temp} °C`;
}

export function displayWeatherError() {
  const weatherElement = document.getElementById('weather');
  const tempElement = document.getElementById('temperature');

  if (weatherElement) weatherElement.textContent = 'Unable to fetch weather';
  if (tempElement) tempElement.textContent = '';
}

export function displayNetworkSpeed(text) {
  const speedElement = document.getElementById('speed-value');
  if (speedElement) speedElement.textContent = text;
}

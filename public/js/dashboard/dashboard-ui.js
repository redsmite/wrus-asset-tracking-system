// dashboard-ui.js

import { Permit } from "../permit/permit-data.js";
import { PortalBubble } from "../components/PortalBubble.js";
import { NotificationBox } from "../components/notification.js";
import { filterPermitsByCity } from "./permit-city-summary.js";

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
  if (!document.getElementById('announcementModal')) {
    const modalHTML = `
      <div class="modal fade" id="announcementModal" tabindex="-1" aria-labelledby="announcementModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="announcementModalLabel"> Announcement</h5>
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
    document.getElementById('announcementMessage').innerHTML = message;
  }

  const modalElement = document.getElementById('announcementModal');
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

export async function renderEncodedPermitsSummary() {
  PortalBubble.trigger();
  const userId = localStorage.getItem('wrusUserId');
  if (!userId) return;

  try {
    const permits = await Permit.getAll();
    const userPermits = permits.filter(p => p.encodedBy === userId);
    const monthlyCounts = {};

    userPermits.forEach(p => {
      const date = p.createdAt?.toDate?.() || new Date(p.timestamp?.seconds * 1000);
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthlyCounts[label] = (monthlyCounts[label] || 0) + 1;
    });

    const container = document.getElementById('encodedPermitSummary');
    container.innerHTML = '';

    if (Object.keys(monthlyCounts).length === 0) {
      container.classList.add('d-none');
      document.getElementById('noEncodedMessage').classList.remove('d-none');
      return;
    }

    Object.entries(monthlyCounts).forEach(([month, count]) => {
      const card = document.createElement('div');
      card.className = 'scorecard-item';
      card.innerHTML = `
        <div class="scorecard-month">
          <i class="bi bi-calendar3"></i> ${month}
        </div>
        <div class="scorecard-count">
          <i class="bi bi-check2-circle"></i> ${count} Permit${count > 1 ? 's' : ''}
        </div>
      `;
      container.appendChild(card);
    });

    container.classList.remove('d-none');
    document.getElementById('noEncodedMessage').classList.add('d-none');
  } catch (err) {
    console.error('Failed to load encoded permit summary:', err);
  }
}

export function handleEncodedRefreshButton() {
  const refreshBtn = document.getElementById('refreshEncodedBtn');
  const COOLDOWN_SECONDS = 60;
  const LAST_REFRESH_KEY = 'lastEncodedRefresh';

  function getRemainingCooldown() {
    const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
    if (!lastRefresh) return 0;
    const elapsed = (Date.now() - parseInt(lastRefresh, 10)) / 1000;
    return Math.max(0, COOLDOWN_SECONDS - Math.floor(elapsed));
  }

  function startCooldown() {
    localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString());
    let remaining = COOLDOWN_SECONDS;
    refreshBtn.disabled = true;
    const originalHTML = refreshBtn.innerHTML;

    const interval = setInterval(() => {
      remaining--;
      refreshBtn.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(interval);
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalHTML;
      }
    }, 1000);
  }

  const remainingCooldown = getRemainingCooldown();
  if (remainingCooldown > 0) {
    refreshBtn.disabled = true;
    let remaining = remainingCooldown;
    const originalHTML = refreshBtn.innerHTML;

    const interval = setInterval(() => {
      remaining--;
      refreshBtn.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(interval);
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalHTML;
      }
    }, 1000);
  }

  refreshBtn.addEventListener('click', async () => {
    const remaining = getRemainingCooldown();
    if (remaining > 0) {
      NotificationBox.show(`Please wait ${remaining}s before refreshing again.`);
      return;
    }

    try {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i> Refreshing...`;
      await Permit.refreshCache();
      await renderEncodedPermitsSummary();
      await filterPermitsByCity();
      NotificationBox.show("Encoded permits refreshed.");
      startCooldown();
    } catch (err) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `<i class="bi bi-arrow-clockwise"></i>`;
      console.error(err);
      NotificationBox.show("Error during encoded refresh.");
    }
  });
}

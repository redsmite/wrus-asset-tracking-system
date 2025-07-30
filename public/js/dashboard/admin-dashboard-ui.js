import { Permit } from "../data/cache/permit-data.js";
import { Users } from "../data/cache/user-data.js"
import { Consumable } from '../data/cache/consumable-data.js';
import { ICS } from '../data/cache/ics-data.js';
import { WUSData } from '../data/cache/wrus-data.js';
import { PortalBubble } from "../components/PortalBubble.js";
import { NotificationBox } from '../components/notification.js';
import { Ledger } from "../data/cache/ledger-data.js";

// 🔐 Authentication Check
export function checkAuthentication() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) window.location.href = "index.html";
}

// 🔄 Refresh Cache Every 8 Hours
export async function refreshAllCachesEvery8Hours() {
  await Promise.all([
    Users.autoRefreshEvery8Hours?.(),
    Consumable.autoRefreshEvery8Hours?.(),
    ICS.autoRefreshEvery8Hours?.(),
    Permit.autoRefreshEvery8Hours?.(),
    WUSData.autoRefreshEvery8Hours?.(),
    Ledger.autoRefreshEvery8Hours?.()
  ]);
}

// 🔁 Handle Refresh Button for Permit Summary
export function handleEncodedRefreshButton() {
  PortalBubble.trigger();
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

  // On load, check if cooldown is active
  const remainingCooldown = getRemainingCooldown();
  if (remainingCooldown > 0) {
    refreshBtn.disabled = true;
    let remaining = remainingCooldown;
    const originalHTML = refreshBtn.innerHTML;
    refreshBtn.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> ${remaining}s`;

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
      await showEncodedPermitsByUserPerMonth();
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

// 📊 Permit Summary by User and Month
export async function showEncodedPermitsByUserPerMonth() {
  try {
    const permits = await Permit.getAll();
    const listContainer = document.getElementById('encodedPermitTableBody');
    const noRecord = document.getElementById('noEncodedMessage');

    listContainer.innerHTML = '';

    if (!permits.length) {
      listContainer.classList.add('d-none');
      noRecord.classList.remove('d-none');
      return;
    }

    const usersMap = await Users.getUsersMap();
    const summary = {}; // { userId: { "Month Year": count } }
    const monthSet = new Set();

    permits.forEach(p => {
      const userId = p.encodedBy;
      if (!userId) return;

      const date = p.createdAt?.toDate?.() || new Date(p.timestamp?.seconds * 1000);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthSet.add(monthYear);

      if (!summary[userId]) summary[userId] = {};
      if (!summary[userId][monthYear]) summary[userId][monthYear] = 0;
      summary[userId][monthYear]++;
    });

    const monthsSorted = Array.from(monthSet).sort((a, b) => {
      return new Date('1 ' + a) - new Date('1 ' + b);
    });

    const pastelColors = [
      '#ffe0e0', '#e0f7fa', '#e8f5e9',
      '#f3e5f5', '#fff3e0', '#f0f4c3',
      '#fbe9e7', '#ede7f6'
    ];

    let colorIndex = 0;
    const userEntries = Object.entries(summary);
    for (let i = 0; i < userEntries.length; i += 3) {
      const row = document.createElement('div');
      row.className = 'scorecard-row';

      const chunk = userEntries.slice(i, i + 3);
      chunk.forEach(([userId, userData]) => {
        const fullName = usersMap[userId] || `Unknown (${userId})`;
        const column = document.createElement('div');
        column.className = 'scorecard-column';
        column.style.backgroundColor = pastelColors[colorIndex % pastelColors.length];
        colorIndex++;

        const header = document.createElement('div');
        header.className = 'user-header';
        header.innerHTML = `<i class="bi bi-person-circle"></i> ${fullName}`;
        column.appendChild(header);

        monthsSorted.forEach(month => {
          const count = userData[month] || 0;
          const entry = document.createElement('div');
          entry.className = 'scorecard-entry';
          entry.innerHTML = `
            <div><i class="bi bi-calendar3"></i> ${month}</div>
            <div><i class="bi bi-check2-circle"></i> ${count} Permit${count !== 1 ? 's' : ''}</div>
          `;
          column.appendChild(entry);
        });

        row.appendChild(column);
      });

      listContainer.appendChild(row);
    }

    listContainer.classList.remove('d-none');
    noRecord.classList.add('d-none');

  } catch (error) {
    console.error("Admin permit summary error:", error);
  }
}

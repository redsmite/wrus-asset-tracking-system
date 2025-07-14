// dashboard-init.js

import { Sidebar } from "../components/sidebar.js";
import { PortalBubble } from "../components/PortalBubble.js";
import { Users } from '../user/user-data.js';
import { Consumable } from '../consumable/consumable-data.js';
import { ICS } from '../ics/ics-data.js';
import { Permit } from "../permit/permit-data.js";
import { WUSData } from "../wrus/wrus-data.js";
import { NotificationBox } from "../components/notification.js";

import {
  displayWelcomeText,
  updateDateTime,
  renderEncodedPermitsTable,
  displayWeather,
  displayWeatherError,
  displayNetworkSpeed,
} from './dashboard-ui.js';
import { Spinner } from "../components/spinner.js";
import { filterPermitsByCity } from "./permit-city-summary.js";

document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  refreshAllCachesEvery8Hours();
  displayWelcomeText();
  Sidebar.render();
  showEncodedPermitsByMonth();
  handleEncodedRefreshButton();
  filterPermitsByCity();

  // updateDateTime();
  // setInterval(updateDateTime, 1000);

  // fetchWeather();
  // checkNetworkSpeed();
  // setInterval(checkNetworkSpeed, 30000);
});

// 🔐 Authentication Check
function checkAuthentication() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) window.location.href = "index.html";
}

export async function refreshAllDailyCaches() {
  await Promise.all([
    Users.autoRefreshDaily?.(),
    Consumable.autoRefreshDaily?.(),
    ICS.autoRefreshDaily?.(),
    Permit.autoRefreshDaily?.(),
    WUSData.autoRefreshDaily?.(),
  ]);

  console.log("✅ All daily caches refreshed.");
}

export async function refreshAllCachesEvery8Hours() {
  await Promise.all([
    Users.autoRefreshEvery8Hours?.(),
    Consumable.autoRefreshEvery8Hours?.(),
    ICS.autoRefreshEvery8Hours?.(),
    Permit.autoRefreshEvery8Hours?.(),
    WUSData.autoRefreshEvery8Hours?.(),
  ]);
}

// 📊 Load Encoded Permits Summary
async function showEncodedPermitsByMonth() {
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

function handleEncodedRefreshButton() {
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
      await showEncodedPermitsByMonth();
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

// 🌤️ Fetch Weather
async function fetchWeather() {
  const apiKey = 'a04baf582971a40d96b801d76ef3a92a';
  const city = 'Manila';

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Weather fetch error');

    const desc = data.weather[0].description;
    const temp = data.main.temp;
    displayWeather(desc.charAt(0).toUpperCase() + desc.slice(1), temp);
  } catch (err) {
    console.error('Weather fetch error:', err);
    displayWeatherError();
  }
}

// ⚡ Check Network Speed
function checkNetworkSpeed() {
  const image = new Image();
  const startTime = Date.now();
  const testUrl = "https://www.google.com/images/phd/px.gif?nn=" + startTime;

  image.onload = () => {
    const duration = (Date.now() - startTime) / 1000;
    const bitsLoaded = 43 * 8;
    const speedBps = bitsLoaded / duration;
    const speedKbps = speedBps / 1024;
    const speedMbps = speedKbps / 1024;

    const display = speedMbps > 0.5
      ? `${speedMbps.toFixed(2)} Mbps`
      : `${speedKbps.toFixed(2)} Kbps`;

    displayNetworkSpeed(display);
  };

  image.onerror = () => {
    displayNetworkSpeed("Error checking speed");
  };

  image.src = testUrl;
}

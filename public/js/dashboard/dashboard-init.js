// dashboard-init.js

import { Sidebar } from "../components/sidebar.js";
import { PortalBubble } from "../components/PortalBubble.js";
import { Permit } from "../permit/permit-data.js";

import {
  displayWelcomeText,
  updateDateTime,
  renderEncodedPermitsTable,
  displayWeather,
  displayWeatherError,
  displayNetworkSpeed,
} from './dashboard-ui.js';

document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  setupLogoutButtons();
  displayWelcomeText();
  Sidebar.render();
  showEncodedPermitsByMonth();

  updateDateTime();
  setInterval(updateDateTime, 1000);

  fetchWeather();
  checkNetworkSpeed();
  setInterval(checkNetworkSpeed, 30000);
});

// 🔐 Authentication Check
function checkAuthentication() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) window.location.href = "index.html";
}

// 🚪 Logout Buttons
function setupLogoutButtons() {
  const logout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  };

  const logoutBtn = document.getElementById("logoutBtn");
  const logoutBtnMobile = document.getElementById("logoutBtnMobile");

  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", logout);
}

// 📊 Load Encoded Permits Summary
async function showEncodedPermitsByMonth() {
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

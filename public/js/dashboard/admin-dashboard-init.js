import { adminVerification } from '../admin/admin-verification.js';
import { Sidebar } from "../components/sidebar.js";
import { PortalBubble } from "../components/PortalBubble.js";
import { Permit } from "../permit/permit-data.js";
import { Users } from "../user/user-data.js";

import {
  displayWelcomeText,
  updateDateTime,
  displayWeather,
  displayWeatherError,
  displayNetworkSpeed,
} from './dashboard-ui.js';

document.addEventListener('DOMContentLoaded', () => {
  adminVerification();
  checkAuthentication();
  setupLogoutButtons();
  displayWelcomeText();
  showEncodedPermitsByUserPerMonth();
  Sidebar.render();
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

async function showEncodedPermitsByUserPerMonth() {
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
    const summary = {}; // { userId: { "July 2025": count } }
    const monthSet = new Set();

    // Step 1: Build summary object
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

    // Step 2: Render per user column
const userEntries = Object.entries(summary);
for (let i = 0; i < userEntries.length; i += 3) {
  const row = document.createElement('div');
  row.className = 'scorecard-row'; // we'll style this in CSS

  const chunk = userEntries.slice(i, i + 3); // 3 users at a time

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

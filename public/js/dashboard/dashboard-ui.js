// dashboard-ui.js

export function displayWelcomeText() {
  const welcomeText = document.getElementById("welcomeText");
  const userFullName = localStorage.getItem("userFullName");

  if (welcomeText && userFullName) {
    welcomeText.textContent = `Welcome ${userFullName}`;
  }
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

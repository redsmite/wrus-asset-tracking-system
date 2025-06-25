import { Sidebar } from "./components/sidebar.js";

document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  setupLogoutButtons();
  displayWelcomeText();
  Sidebar.render();

  // 🕒 Initialize Date and Time
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // 🌦️ Initialize Weather
  fetchWeather();

  // 🌐 Initialize Network Speed
  checkNetworkSpeed();
  setInterval(checkNetworkSpeed, 30000);
});


// 🔐 Authentication Check
function checkAuthentication() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) {
    window.location.href = "index.html";
  }
}

// 🚪 Setup Logout Buttons
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

// 🙋‍♂️ Display Welcome Text
function displayWelcomeText() {
  const welcomeText = document.getElementById("welcomeText");
  const userFullName = localStorage.getItem("userFullName");

  if (welcomeText && userFullName) {
    welcomeText.textContent = `Welcome ${userFullName}`;
  }
}

// 🕒 Update Date & Time
function updateDateTime() {
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

// 🌤️ Fetch Weather Info
async function fetchWeather() {
  const apiKey = 'a04baf582971a40d96b801d76ef3a92a';
  const city = 'Manila';

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch weather');
    }

    const weather = data.weather[0].description;
    const temp = data.main.temp;

    const weatherElement = document.getElementById('weather');
    const tempElement = document.getElementById('temperature');

    if (weatherElement) {
      weatherElement.textContent = weather.charAt(0).toUpperCase() + weather.slice(1);
    }
    if (tempElement) {
      tempElement.textContent = `${temp} °C`;
    }

  } catch (error) {
    const weatherElement = document.getElementById('weather');
    const tempElement = document.getElementById('temperature');

    if (weatherElement) weatherElement.textContent = 'Unable to fetch weather';
    if (tempElement) tempElement.textContent = '';

    console.error('Weather fetch error:', error);
  }
}

// ⚡ Check Network Speed
function checkNetworkSpeed() {
  const image = new Image();
  const startTime = Date.now();
  const cacheBuster = `?nn=${startTime}`;
  const testImageUrl = "https://www.google.com/images/phd/px.gif" + cacheBuster;

  image.onload = () => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    const bitsLoaded = 43 * 8; // 43 bytes × 8 bits
    const speedBps = bitsLoaded / duration;
    const speedKbps = speedBps / 1024;
    const speedMbps = speedKbps / 1024;

    const displaySpeed = speedMbps > 0.5
      ? `${speedMbps.toFixed(2)} Mbps`
      : `${speedKbps.toFixed(2)} Kbps`;

    const speedElement = document.getElementById('speed-value');
    if (speedElement) {
      speedElement.textContent = displaySpeed;
    }
  };

  image.onerror = () => {
    const speedElement = document.getElementById('speed-value');
    if (speedElement) {
      speedElement.textContent = "Error checking speed";
    }
  };

  image.src = testImageUrl;
}

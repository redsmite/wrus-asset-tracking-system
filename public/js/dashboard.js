document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("loggedInUser");

  if (!user) {
    window.location.href = "index.html";
    return;
  }

 const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userFullName");
      window.location.href = "index.html";
    });
  }

  const logoutBtnMobile = document.getElementById("logoutBtnMobile");
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userFullName");
      window.location.href = "index.html";
    });
  }

  // ✅ Load full name from localStorage and display it
  const welcomeText = document.getElementById("welcomeText");
  const userFullName = localStorage.getItem("userFullName");

  console.log("Loaded full name:", userFullName);

  if (welcomeText && userFullName) {
    welcomeText.textContent = `Welcome ${userFullName}`;
  }
});

// 🕒 Live date and time updater
  function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString(undefined, options);
    document.getElementById('time').textContent = now.toLocaleTimeString();
  }

  setInterval(updateDateTime, 1000); // update every second
  updateDateTime(); // initial call

  // 🌤️ Weather from OpenWeatherMap API
async function fetchWeather() {
  const apiKey = 'a04baf582971a40d96b801d76ef3a92a';
  const city = 'Manila';

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    const data = await response.json();

    if (response.status !== 200) {
      throw new Error(data.message || 'Failed to fetch weather');
    }

    const weather = data.weather[0].description;
    const temp = data.main.temp;

    document.getElementById('weather').textContent = weather.charAt(0).toUpperCase() + weather.slice(1);
    document.getElementById('temperature').textContent = `${temp} °C`;

  } catch (error) {
    document.getElementById('weather').textContent = 'Unable to fetch weather';
    document.getElementById('temperature').textContent = '';
    console.error(error);
  }
}

function checkNetworkSpeed() {
  const image = new Image();
  const startTime = new Date().getTime();
  const cacheBuster = '?nn=' + startTime;
  const testImageUrl = "https://www.google.com/images/phd/px.gif" + cacheBuster; // ~43 bytes

  image.onload = function () {
    const endTime = new Date().getTime();
    const duration = (endTime - startTime) / 1000;
    const bitsLoaded = 43 * 8; // 43 bytes × 8 bits
    const speedBps = bitsLoaded / duration;
    const speedKbps = speedBps / 1024;
    const speedMbps = speedKbps / 1024;

    const displaySpeed = speedMbps > 0.5
      ? `${speedMbps.toFixed(2)} Mbps`
      : `${speedKbps.toFixed(2)} Kbps`;

    document.getElementById('speed-value').textContent = displaySpeed;
  };

  image.onerror = function () {
    document.getElementById('speed-value').textContent = "Error checking speed";
  };

  image.src = testImageUrl;
}

fetchWeather();
// Check immediately, then every 30 seconds
checkNetworkSpeed();
setInterval(checkNetworkSpeed, 30000);
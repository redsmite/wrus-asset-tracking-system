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

fetchWeather();

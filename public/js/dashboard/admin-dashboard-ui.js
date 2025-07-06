// dashboard-ui.js

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

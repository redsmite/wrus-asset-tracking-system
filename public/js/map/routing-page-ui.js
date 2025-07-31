import { Permit } from "../data/cache/permit-data.js";
import { Sidebar } from "../components/sidebar.js";
import { NotificationBox } from "../components/notification.js";
import { PortalBubble } from "../components/PortalBubble.js";
import { initMap } from "./map-init.js";

export function initializePage(){
  Sidebar.render();
  setCurrentLocationInStartInput();
  enableEndLocationAutocomplete();
  initMap("routingMap");
  setupRouting("routingMap");
}

function setCurrentLocationInStartInput() {
  const startInput = document.getElementById("startLocation");
  
  if (!startInput) {
    console.warn("❗ startLocation input field not found.");
    return;
  }

  if (!navigator.geolocation) {
    console.warn("⚠️ Geolocation not supported by this browser.");
    startInput.value = "14.609100, 121.022300";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      startInput.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
    },
    (error) => {
      console.warn("⚠️ Geolocation failed:", error.message);
      startInput.value = "14.609100, 121.022300";
    }
  );
}

function enableEndLocationAutocomplete() {
  const input = document.querySelector("#endLocation");

  input.addEventListener("keyup", async (e) => {
    const term = e.target.value.trim().toLowerCase();
    if (term.length < 2) return;

    try {
      const permits = await Permit.getAll();

      const permitMatches = permits
        .filter(p =>
          p.permittee?.toLowerCase().includes(term) ||
          p.permitNo?.toLowerCase().includes(term)
        )
        .map(p => ({
          label: `${p.permittee} (${p.permitNo})`,
          lat: p.latitude || "",
          lng: p.longitude || "",
          permitNo: p.permitNo
        }));

      let dropdown = document.querySelector("#endLocationDropdown");
      if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.id = "endLocationDropdown";
        dropdown.className = "list-group position-absolute w-100";
        input.parentNode.appendChild(dropdown);
      }
      dropdown.innerHTML = "";

      permitMatches.forEach(item => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "list-group-item list-group-item-action";
        option.textContent = item.label;
        option.onclick = () => {
          input.value = `${item.lat}, ${item.lng}`;
          dropdown.innerHTML = "";

          document.querySelector("#endLat").value = item.lat;
          document.querySelector("#endLng").value = item.lng;
          PortalBubble.trigger();
        };
        dropdown.appendChild(option);
      });

    } catch (err) {
      console.error("❌ Autocomplete error:", err);
    }
  });
}

function setupRouting(mapDivId = "leafletMap") {
  // ✅ Initialize your map first
  initMap(mapDivId);

  // ✅ Grab the same map reference used in initMap()
  // (Assuming `map` is a global in map-init.js – which it looks like it is)
  const mapInstance = window.map; 

  let routingControl = null; // hold reference so we can clear it later

  document.querySelector("#routingForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const startLocation = document.querySelector("#startLocation").value;
    const endLat = parseFloat(document.querySelector("#endLat").value);
    const endLng = parseFloat(document.querySelector("#endLng").value);

    if (!startLocation || isNaN(endLat) || isNaN(endLng)) {
      NotificationBox.show("Please enter a starting point and select a valid end location");
      return;
    }

    try {
      // ✅ Geocode starting location using Nominatim
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startLocation)}`);
      const data = await response.json();

      if (data.length === 0) {
        NotificationBox.show("Start location not found");
        return;
      }

      const startLat = parseFloat(data[0].lat);
      const startLng = parseFloat(data[0].lon);

      // ✅ Remove previous route if exists
      if (routingControl) {
        mapInstance.removeControl(routingControl);
      }

      // ✅ Add routing machine
      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(startLat, startLng),
          L.latLng(endLat, endLng)
        ],
        routeWhileDragging: false
      }).addTo(mapInstance);

    } catch (err) {
      console.error("❌ Geocoding error:", err);
      NotificationBox.show("An error occurred while finding the route");
    }
  });
}







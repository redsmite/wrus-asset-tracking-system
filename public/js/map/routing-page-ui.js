import { Permit } from "../data/cache/permit-data.js";
import { Sidebar } from "../components/sidebar.js";
import { NotificationBox } from "../components/notification.js";
import { Spinner } from "../components/spinner.js";
import { PortalBubble } from "../components/PortalBubble.js";
import { initMap, plotRouteOnMap, removePulseMarker } from "./map-init.js";

export function initializePage(){
  Sidebar.render();
  Spinner.render();
  toggleFormShowHide();
  setCurrentLocationInStartInput();
  enableEndLocationAutocomplete();
  initMap("routingMap", false);
  getRouteSubmitForm();
  stopTrackingHandler();
}

let selectedPermitInfo = null;
let geoWatchId = null;
let trackingLogInterval = null;
let lastLat = null;
let lastLng = null;

function toggleFormShowHide(){
  const toggleBtn = document.getElementById('toggleRoutingFormBtn');
  const formContainer = document.getElementById('routingFormContainer');

  toggleBtn.addEventListener('click', () => {
    const isVisible = formContainer.style.display === 'block';
    formContainer.style.display = isVisible ? 'none' : 'block';
    toggleBtn.innerHTML = isVisible 
      ? '<i class="bi bi-caret-down-fill"></i> Show Routing Form' 
      : '<i class="bi bi-caret-up-fill"></i> Hide Routing Form';
  });
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
      Spinner.show(); 

      const permits = await Permit.getAll();

      const permitMatches = permits
        .filter(p =>
          p.permittee?.toLowerCase().includes(term) ||
          p.permitNo?.toLowerCase().includes(term)
        )
        .map(p => ({
          id: p.id,
          label: `${p.permittee} (${p.permitNo})`,
          lat: p.latitude || "",
          lng: p.longitude || "",
          permitNo: p.permitNo,
          permittee: p.permittee,
          pdfUrl: p.pdfUrl || null
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

          selectedPermitInfo = item;

          document.getElementById("routeHeading").textContent =
            `Route to: ${item.permittee} (Permit No. ${item.permitNo})`;

          PortalBubble.trigger();
        };

        dropdown.appendChild(option);
      });

    } catch (err) {
      console.error("❌ Autocomplete error:", err);
    } finally {
      Spinner.hide();
    }
  });
}

export function getRouteSubmitForm() {
  document.getElementById("routingForm").addEventListener("submit", function (e) {
    e.preventDefault();

    Spinner.show();

    const endLat = parseFloat(document.getElementById("endLat").value);
    const endLng = parseFloat(document.getElementById("endLng").value);

    // ✅ If already tracking, stop the old watch & interval first
    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId);
      geoWatchId = null;
    }
    if (trackingLogInterval) {
      clearInterval(trackingLogInterval);
      trackingLogInterval = null;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const startLat = position.coords.latitude;
        const startLng = position.coords.longitude;

        // ✅ Reset last position for heading calculation
        lastLat = startLat;
        lastLng = startLng;

        // ✅ Initial plot with current location
        plotRouteOnMap(startLat, startLng, endLat, endLng, selectedPermitInfo, true, 0);
        Spinner.hide();

        // ✅ Notify user that tracking started
        NotificationBox.show("Live tracking has started.", "success");

        // ✅ Start live tracking
        geoWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            const newLat = pos.coords.latitude;
            const newLng = pos.coords.longitude;

            // ✅ Compute heading based on movement
            let headingDeg = 0;
            if (lastLat !== null && lastLng !== null) {
              headingDeg = calculateBearing(lastLat, lastLng, newLat, newLng);
            }

            // ✅ Update map with heading
            plotRouteOnMap(newLat, newLng, endLat, endLng, selectedPermitInfo, false, headingDeg);

            // ✅ Update last position for next calculation
            lastLat = newLat;
            lastLng = newLng;
          },
          (err) => console.warn("⚠️ Tracking error:", err),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        // ✅ Heartbeat interval (for UI indicators)
        trackingLogInterval = setInterval(() => {
          // Could be used for UI indicators or logs
        }, 1000);
      });
    } else {
      console.warn("❌ Geolocation not supported.");
      plotRouteOnMap(14.6091, 121.0223, endLat, endLng, selectedPermitInfo, true, 0);
      Spinner.hide();
    }
  });
}

function calculateBearing(lat1, lng1, lat2, lng2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let θ = Math.atan2(y, x);
  θ = (θ * 180) / Math.PI;
  return (θ + 360) % 360;
}

function stopTrackingHandler() {
  document.getElementById("stopTrackingBtn").addEventListener("click", () => {
    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId);
      geoWatchId = null;
      NotificationBox.show("🛑 Live tracking stopped.","error");
    }

    if (trackingLogInterval) {
      clearInterval(trackingLogInterval);
      trackingLogInterval = null;
    }

    removePulseMarker();
  });
}





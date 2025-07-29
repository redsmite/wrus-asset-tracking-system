let mapInitialized = false;
let map;
let marker;
let extraMarkers = [];

export function initMap(mapDivId = "leafletMap") {
  if (mapInitialized) return;

  map = L.map(mapDivId).setView([14.6091, 121.0223], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  marker = L.marker([14.6091, 121.0223]).addTo(map)
    .bindPopup("National Capital Region")
    .openPopup();

  legend.addTo(map);

  mapInitialized = true;
}

export function setupMapModal(modalId = "mapModal", mapDivId = "leafletMap") {
  const mapModal = document.getElementById(modalId);

  if (!mapModal) {
    console.error(`Modal with ID "${modalId}" not found.`);
    return;
  }

  mapModal.addEventListener("shown.bs.modal", function () {
    if (!mapInitialized) {
      initMap(mapDivId);
    } else {
      map.invalidateSize();
    }
  });
}


export function updateMapLocation(city, lat, lng) {
  if (!map) return;

  map.setView([lat, lng], 13);

  if (marker) {
    marker.setLatLng([lat, lng]).bindPopup(city).openPopup();
  } else {
    marker = L.marker([lat, lng]).addTo(map).bindPopup(city).openPopup();
  }
}

// Define blue & green markers (using Leaflet default icon colors)
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const violetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'info legend');
  div.style.background = 'white';
  div.style.padding = '8px';
  div.style.border = '1px solid #ccc';
  div.style.borderRadius = '6px';
  div.style.fontSize = '14px';
  div.style.lineHeight = '18px';

  div.innerHTML = `
    <strong>Legend</strong><br>
    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png" style="width: 18px;"> Permittee <br>
    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" style="width: 18px;"> Water Source<br>
    <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" style="width: 18px;"> Water User
  `;
  return div;
};

export function addMapMarker(lat, lng, label, isWaterSource, permitNo) {
  if (!map) return;

  let markerIcon;

  if (permitNo && permitNo.trim() !== "") {
    markerIcon = violetIcon;
  } else {
    markerIcon = isWaterSource ? blueIcon : greenIcon;
  }

  const m = L.marker([lat, lng], { icon: markerIcon })
    .addTo(map)
    .bindPopup(label || "Unknown Site");

  extraMarkers.push(m);
}

export function clearExtraMarkers() {
  if (!map) return;

  extraMarkers.forEach(m => map.removeLayer(m));
  extraMarkers = [];
}

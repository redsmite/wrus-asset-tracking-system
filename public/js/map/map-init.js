let mapInitialized = false;
export let map;
let marker;
let extraMarkers = [];
let geoWatchId = null;
let liveStartMarker = null;
let routeZoomed = false;
let livePulseMarker = null;

export function initMap(mapDivId = "leafletMap", showLegend = true, enableGeolocation = true) {
  if (mapInitialized) return;

  map = L.map(mapDivId).setView([14.6091, 121.0223], 12);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

  // ✅ Only run geolocation if enabled
  if (enableGeolocation && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        map.setView([userLat, userLng], 14);

        marker = L.marker([userLat, userLng]).addTo(map)
          .bindPopup("📍 You are here")
          .openPopup();
      },
      () => {
        console.warn("Geolocation failed. Using default location.");
        marker = L.marker([14.6091, 121.0223]).addTo(map)
          .bindPopup("National Capital Region")
          .openPopup();
      }
    );
  } else if (!enableGeolocation) {
    console.warn("📍 Geolocation is disabled. Using default location.");
    marker = L.marker([14.6091, 121.0223]).addTo(map)
      .bindPopup("National Capital Region")
      .openPopup();
  } else {
    console.warn("Geolocation is not supported by this browser.");
    marker = L.marker([14.6091, 121.0223]).addTo(map)
      .bindPopup("National Capital Region")
      .openPopup();
  }

  // Only add legend if requested
  if (showLegend) {
    legend.addTo(map);
  }

  // Load boundaries
  loadBarangayBoundaries("js/data/geojson/Barangays_NCR.geojson");
  loadManilaBoundary("js/data/geojson/manila.geojson");
  loadMandaluyongBoundary("js/data/geojson/mandaluyong.geojson");
  loadMarikinaBoundary("js/data/geojson/marikina.geojson");
  loadPasigBoundary("js/data/geojson/pasig.geojson");
  loadQuezonCityBoundary("js/data/geojson/quezon_city.geojson");
  loadSanJuanBoundary("js/data/geojson/san_juan.geojson");
  loadCaloocanBoundary("js/data/geojson/caloocan.geojson");
  loadMalabonBoundary("js/data/geojson/malabon.geojson");
  loadNavotasBoundary("js/data/geojson/navotas.geojson");
  loadValenzuelaBoundary("js/data/geojson/valenzuela.geojson");
  loadLasPinasBoundary("js/data/geojson/las_piñas.geojson");
  loadMakatiBoundary("js/data/geojson/makati.geojson");  
  loadMuntinlupaBoundary("js/data/geojson/muntinlupa.geojson");
  loadParanaqueBoundary("js/data/geojson/parañaque.geojson");  
  loadPasayBoundary("js/data/geojson/pasay.geojson");
  loadPaterosBoundary("js/data/geojson/pateros.geojson");
  loadTaguigBoundary("js/data/geojson/taguig.geojson");


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

function loadBarangayBoundaries(geoJsonUrl = "Barangays_NCR.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          color: "#ffffff",
          weight: 0.9,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);

          // Add barangay label
          const labelText = feature.properties.ADM4_EN;
          const coords = feature.geometry.coordinates;
          let latlng;

          if (feature.geometry.type === "Polygon") {
            latlng = getPolygonCentroid(coords[0]);
          } else if (feature.geometry.type === "MultiPolygon") {
            latlng = getPolygonCentroid(coords[0][0]);
          }

          if (latlng) {
            const label = L.divIcon({
              className: "barangay-label",
              html: labelText,
              iconSize: null
            });

            const marker = L.marker(latlng, { icon: label, interactive: false });

            if (map.getZoom() >= 14) marker.addTo(map);

            if (!map._barangayLabels) map._barangayLabels = [];
            map._barangayLabels.push(marker);
          }
        }
      }).addTo(map);

      // Show/hide labels based on zoom level
      map.on("zoomend", () => {
        if (!map._barangayLabels) return;
        const showLabels = map.getZoom() >= 14;

        map._barangayLabels.forEach(marker => {
          if (showLabels && !map.hasLayer(marker)) {
            marker.addTo(map);
          } else if (!showLabels && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        });
      });
    })
    .catch(err => console.error("Error loading GeoJSON:", err));
}

function loadManilaBoundary(geoJsonUrl = "manila.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: "#ff0000",    // Red colored boundary
          weight: 5,           // Thicker line (increased from 3 to 5)
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      // 📍 Add a "Manila" label at the center of the boundary
      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const manilaLabel = L.divIcon({
        className: 'manila-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: red;">Manila</div>',
        iconSize: [100, 40]
      });

      L.marker(center, { icon: manilaLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading manila.geojson:", err));
}

function loadMandaluyongBoundary(geoJsonUrl = "mandaluyong.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: "#007bff",
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      // 📍 Add a "Mandaluyong" label at the center of the boundary
      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const mandaluyongLabel = L.divIcon({
        className: 'mandaluyong-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: #007bff;">Mandaluyong</div>',
        iconSize: [120, 40]
      });

      L.marker(center, { icon: mandaluyongLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading mandaluyong.geojson:", err));
}

function loadMarikinaBoundary(geoJsonUrl = "marikina.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: "#28a745", // ✅ Green color for Marikina
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      // 📍 Add a "Marikina" label at the center of the boundary
      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const marikinaLabel = L.divIcon({
        className: 'marikina-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: #28a745;">Marikina</div>',
        iconSize: [120, 40]
      });

      L.marker(center, { icon: marikinaLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading marikina.geojson:", err));
}

function loadPasigBoundary(geoJsonUrl = "pasig.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: '#800080', // ✅ Blue color for Pasig
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      // 📍 Add a "Pasig" label at the center of the boundary
      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const pasigLabel = L.divIcon({
        className: 'pasig-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: #800080;">Pasig</div>',
        iconSize: [120, 40]
      });

      L.marker(center, { icon: pasigLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading pasig.geojson:", err));
}

function loadQuezonCityBoundary(geoJsonUrl = "quezon_city.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: '#FFA500', // 🟧 Orange color for Quezon City
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      // 📍 Add a "Quezon City" label at the center of the boundary
      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const qcLabel = L.divIcon({
        className: 'qc-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: #FFA500;">Quezon City</div>',
        iconSize: [140, 40]
      });

      L.marker(center, { icon: qcLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading quezoncity.geojson:", err));
}

function loadSanJuanBoundary(geoJsonUrl = "san_juan.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: '#008080',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const sjLabel = L.divIcon({
        className: 'sj-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: #008080;">San Juan</div>',
        iconSize: [140, 40]
      });

      L.marker(center, { icon: sjLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading san_juan.geojson:", err));
}

function loadCaloocanBoundary(geoJsonUrl = "caloocan.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: '#9ACD32', // Yellow-green
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const caloocanLabel = L.divIcon({
        className: 'caloocan-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: #9ACD32;">Caloocan</div>',
        iconSize: [140, 40]
      });

      L.marker(center, { icon: caloocanLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading caloocan.geojson:", err));
}

function loadMalabonBoundary(geoJsonUrl = "malabon.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: '#00FFFF', // Cyan
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const label = L.divIcon({
        className: 'malabon-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: #00FFFF;">Malabon</div>',
        iconSize: [140, 40]
      });

      L.marker(center, { icon: label }).addTo(map);
    })
    .catch(err => console.error("Error loading malabon.geojson:", err));
}

function loadNavotasBoundary(geoJsonUrl = "navotas.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'green',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const navotasLabel = L.divIcon({
        className: 'navotas-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: green;">Navotas</div>',
        iconSize: [140, 40]
      });

      L.marker(center, { icon: navotasLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading navotas.geojson:", err));
}

function loadValenzuelaBoundary(geoJsonUrl = "valenzuela.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'pink',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const valenzuelaLabel = L.divIcon({
        className: 'valenzuela-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: pink;">Valenzuela</div>',
        iconSize: [180, 40]
      });

      L.marker(center, { icon: valenzuelaLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading valenzuela.geojson:", err));
}

function loadLasPinasBoundary(geoJsonUrl = "las_piñas.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'teal',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const lasPinasLabel = L.divIcon({
        className: 'las-pinas-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: teal;">Las Piñas</div>',
        iconSize: [180, 40]
      });

      L.marker(center, { icon: lasPinasLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading las_piñas.geojson:", err));
}

function loadMuntinlupaBoundary(geoJsonUrl = "muntinlupa.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'brown',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const muntinlupaLabel = L.divIcon({
        className: 'muntinlupa-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: brown;">Muntinlupa</div>',
        iconSize: [180, 40]
      });

      L.marker(center, { icon: muntinlupaLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading muntinlupa.geojson:", err));
}

function loadParanaqueBoundary(geoJsonUrl = "paranaque.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'orange',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const paranaqueLabel = L.divIcon({
        className: 'paranaque-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: orange;">Parañaque</div>',
        iconSize: [180, 40]
      });

      L.marker(center, { icon: paranaqueLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading paranaque.geojson:", err));
}

function loadMakatiBoundary(geoJsonUrl = "makati.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'pink',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const makatiLabel = L.divIcon({
        className: 'makati-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: pink;">Makati</div>',
        iconSize: [180, 40]
      });

      L.marker(center, { icon: makatiLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading makati.geojson:", err));
}

function loadPasayBoundary(geoJsonUrl = "pasay.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'purple',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const pasayLabel = L.divIcon({
        className: 'pasay-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: purple;">Pasay</div>',
        iconSize: [180, 40]
      });

      L.marker(center, { icon: pasayLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading pasay.geojson:", err));
}

function loadTaguigBoundary(geoJsonUrl = "taguig.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'green',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const taguigLabel = L.divIcon({
        className: 'taguig-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: green;">Taguig</div>',
        iconSize: [180, 40]
      });

      L.marker(center, { icon: taguigLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading taguig.geojson:", err));
}

function loadPaterosBoundary(geoJsonUrl = "pateros.geojson") {
  if (!map) return;

  fetch(geoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const boundaryLayer = L.geoJSON(data, {
        style: {
          color: 'orange',
          weight: 5,
          opacity: 1,
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          const brgy = feature.properties.BRGY_NAME || "Unknown Barangay";
          const city = feature.properties.ADM2_EN || "Unknown City";
          layer.bindPopup(`<strong>${brgy}</strong><br><em>${city}</em>`);
        }
      }).addTo(map);

      const bounds = boundaryLayer.getBounds();
      const center = bounds.getCenter();

      const paterosLabel = L.divIcon({
        className: 'pateros-label',
        html: '<div style="font-size: 24px; font-weight: bold; color: orange;">Pateros</div>',
        iconSize: [180, 40]
      });

      L.marker(center, { icon: paterosLabel }).addTo(map);
    })
    .catch(err => console.error("Error loading pateros.geojson:", err));
}

function getPolygonCentroid(coords) {
  let area = 0, x = 0, y = 0;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [x0, y0] = coords[j];
    const [x1, y1] = coords[i];
    const f = x0 * y1 - x1 * y0;
    area += f;
    x += (x0 + x1) * f;
    y += (y0 + y1) * f;
  }
  area *= 0.5;
  return [y / (6 * area), x / (6 * area)];
}

let liveHeadingMarker = null; // 🔄 New global variable to track heading marker

export function plotRouteOnMap(startLat, startLng, endLat, endLng, permitInfo = null, resetRoute = true, headingDeg = null) {
  if (!map) return;

  if (resetRoute) {
    clearExtraMarkers();
    routeZoomed = false;
  }

  // ✅ START MARKER (Main Icon)
  if (resetRoute) {
    liveStartMarker = L.marker([startLat, startLng], { icon: greenIcon })
      .addTo(map)
      .bindPopup("📍 Starting Point")
      .openPopup();
    extraMarkers.push(liveStartMarker);

    // ✅ Pulsating effect overlay
    livePulseMarker = L.marker([startLat, startLng], {
      icon: L.divIcon({
        className: "pulse-marker",
        iconSize: [20, 20]
      }),
      interactive: false
    }).addTo(map);
    extraMarkers.push(livePulseMarker);

    // ✅ Heading arrow marker (NEW)
    liveHeadingMarker = L.marker([startLat, startLng], {
      icon: L.divIcon({
        className: "heading-arrow",
        html: `<div class="heading-icon" style="transform: rotate(${headingDeg || 0}deg);"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 35],   // ⬅ push the arrow up
      }),
      interactive: false
    }).addTo(map);
    extraMarkers.push(liveHeadingMarker);

  } else {
    // ✅ Move start marker
    if (liveStartMarker?.slideTo) {
      liveStartMarker.slideTo([startLat, startLng], { duration: 800, keepAtCenter: false });
    } else if (liveStartMarker) {
      liveStartMarker.setLatLng([startLat, startLng]);
    }

    // ✅ Move pulse marker
    if (livePulseMarker) {
      livePulseMarker.setLatLng([startLat, startLng]);
    }

    // ✅ Move heading marker & rotate it
    if (liveHeadingMarker) {
      liveHeadingMarker.setLatLng([startLat, startLng]);
      if (headingDeg !== null) {
        liveHeadingMarker._icon.querySelector(".heading-icon").style.transform = `rotate(${headingDeg}deg)`;
      }
    }
  }

  // ✅ END MARKER (only added once)
  if (resetRoute) {
    let popupContent = "🏁 Destination";

    if (permitInfo) {
      popupContent = `
        <div class="permit-popup">
          <div class="permit-popup-row"><strong>Permittee:</strong> ${permitInfo.permittee}</div>
          <div class="permit-popup-row"><strong>Permit No:</strong> ${permitInfo.permitNo}</div>
          <div class="permit-popup-row"><strong>Latitude:</strong> ${permitInfo.lat}</div>
          <div class="permit-popup-row"><strong>Longitude:</strong> ${permitInfo.lng}</div>
          ${
            permitInfo.pdfUrl
              ? `<div class="permit-popup-row">
                  <a href="${permitInfo.pdfUrl}" target="_blank" class="permit-pdf-link">📄 View Permit PDF</a>
                </div>`
              : `<div class="permit-popup-row"><em>No PDF available</em></div>`
          }
        </div>
      `;
    }

    const endMarker = L.marker([endLat, endLng], { icon: violetIcon })
      .addTo(map)
      .bindPopup(popupContent)
      .openPopup();

    extraMarkers.push(endMarker);

    // ✅ Fit map only once
    if (!routeZoomed) {
      map.fitBounds(L.latLngBounds([[startLat, startLng], [endLat, endLng]]), { padding: [50, 50] });
      routeZoomed = true;
    }
  }
}

export function removePulseMarker() {
  if (livePulseMarker) {
    map.removeLayer(livePulseMarker);
    livePulseMarker = null;
    console.log("🔵 Pulse marker removed (via cleanup function).");
  }
}





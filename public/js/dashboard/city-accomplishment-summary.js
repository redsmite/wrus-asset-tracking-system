import { WUSData } from "../data/cache/wrus-data.js";
import { Permit } from "../data/cache/permit-data.js";
import { normalizeBarangay, normalizeCity } from "../utils/normalize.js"
import { updateMapLocation, addMapMarker, clearExtraMarkers } from '../map/map-init.js';

export async function initCityAccomplishmentSummary() {
  const data = await WUSData.fetchAll();
  const container = document.getElementById('cityAccomplishmentTable');
  if (!container) return;

  const grouped = {};
  const barangayGrouped = {};

  let grandPermittees = 0;
  let grandNonPermittees = 0;
  let grandWaterSources = 0;

  data.forEach(entry => {
    const city = normalizeCity(entry.city);
    const barangay = normalizeBarangay(entry.barangay);
    const hasPermit = !!entry.permitNo;
    const isOperational = entry.remarks?.toLowerCase() === 'operational';

    if (!grouped[city]) grouped[city] = { permittees: 0, nonPermittees: 0, waterSources: 0 };
    if (!barangayGrouped[city]) barangayGrouped[city] = {};
    if (!barangayGrouped[city][barangay]) barangayGrouped[city][barangay] = { permittees: 0, nonPermittees: 0, waterSources: 0 };

    if (hasPermit) {
      grouped[city].permittees++;
      barangayGrouped[city][barangay].permittees++;
      grandPermittees++;
    } else {
      grouped[city].nonPermittees++;
      barangayGrouped[city][barangay].nonPermittees++;
      grandNonPermittees++;
    }

    if (isOperational) {
      grouped[city].waterSources++;
      barangayGrouped[city][barangay].waterSources++;
      grandWaterSources++;
    }
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const cities = Object.keys(grouped).sort();
  let html = `
    <h3 class="mb-3">Water Users and Sources Database
      <span class="fs-6 fw-normal"> — As of ${dateStr}</span>
    </h3>
    <table class="table table-bordered table-striped align-middle text-center rounded-0">
      <thead class="table-success">
        <tr>
          <th rowspan="2">City</th>
          <th colspan="3">Water Users</th>
          <th rowspan="2">Water Sources</th>
          <th rowspan="2">Barangay Details</th>
        </tr>
        <tr>
          <th>Permittees</th>
          <th>Non-Permittees</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
  `;

  cities.forEach(city => {
    const { permittees, nonPermittees, waterSources } = grouped[city];
    const total = permittees + nonPermittees;
    html += `
      <tr>
        <td>${city}</td>
        <td>${permittees}</td>
        <td>${nonPermittees}</td>
        <td>${total}</td>
        <td>${waterSources}</td>
        <td>
          <button class="btn btn-3d btn-sm btn-outline-primary view-barangay-btn" 
            data-city="${city}" data-bs-toggle="modal" data-bs-target="#barangayModal">
            View Barangays
          </button>
          <button class="btn btn-3d btn-sm btn-outline-success view-map-btn" 
            data-city="${city}" data-bs-toggle="modal" data-bs-target="#mapModal">
            View Map
          </button>
        </td>
      </tr>`;
  });

  const grandTotalUsers = grandPermittees + grandNonPermittees;
  html += `
      <tr class="table-secondary fw-bold">
        <td>Total</td>
        <td>${grandPermittees}</td>
        <td>${grandNonPermittees}</td>
        <td>${grandTotalUsers}</td>
        <td>${grandWaterSources}</td>
        <td></td>
      </tr>
    </tbody>
  </table>`;

  container.innerHTML = html;

  attachBarangayButtonListener(barangayGrouped);
  attachViewUsersListener();
  attachViewMapListener();
}

function attachBarangayButtonListener(barangayGrouped) {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.view-barangay-btn');
    if (!btn) return;
    handleViewBarangayClick(btn, barangayGrouped);
  });
}

function handleViewBarangayClick(btn, barangayGrouped) {
  const city = btn.getAttribute('data-city');
  const modalLabel = document.getElementById('barangayModalLabel');
  const modalBody = document.getElementById('barangayModalBody');

  modalLabel.textContent = `Barangay Breakdown — ${city}`;

  const barangays = barangayGrouped[city];
  if (!barangays) {
    modalBody.innerHTML = `<p class="text-muted">No data available for ${city}.</p>`;
    return;
  }

  let totalPermittees = 0;
  let totalNonPermittees = 0;
  let totalSources = 0;

  let barangayHtml = `
    <table class="table table-bordered table-striped align-middle text-center">
      <thead class="table-info">
        <tr>
          <th rowspan="2" class="align-middle">Barangay</th>
          <th colspan="3" class="align-middle">Water Users</th>
          <th rowspan="2" class="align-middle">Water Sources</th>
          <th rowspan="2" class="align-middle">Actions</th>
        </tr>
        <tr>
          <th>Permittees</th>
          <th>Non-Permittees</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>`;

  Object.keys(barangays).sort().forEach(brgy => {
    const { permittees, nonPermittees, waterSources } = barangays[brgy];
    const total = permittees + nonPermittees;

    totalPermittees += permittees;
    totalNonPermittees += nonPermittees;
    totalSources += waterSources;

    barangayHtml += `
      <tr>
        <td>${brgy}</td>
        <td>${permittees}</td>
        <td>${nonPermittees}</td>
        <td>${total}</td>
        <td>${waterSources}</td>
        <td>
          <button class="btn btn-3d btn-sm btn-outline-primary view-users-btn"
            data-city="${city}" data-barangay="${brgy}">
            View Users
          </button>
          <button class="btn btn-3d btn-sm btn-outline-success ms-1 view-map-btn"
            data-city="${city}" data-barangay="${brgy}">
            View Map
          </button>
        </td>
      </tr>`;
  });

  const cityTotal = totalPermittees + totalNonPermittees;

  barangayHtml += `
      <tr class="table-secondary fw-bold">
        <td>Total</td>
        <td>${totalPermittees}</td>
        <td>${totalNonPermittees}</td>
        <td>${cityTotal}</td>
        <td>${totalSources}</td>
        <td></td>
      </tr>
    </tbody>
    </table>`;

  modalBody.innerHTML = barangayHtml;

  modalBody.addEventListener('click', handleViewBarangayMapClick);
}

function attachViewUsersListener() {
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.view-users-btn');
    if (btn) {
      const city = btn.getAttribute('data-city');
      const barangay = btn.getAttribute('data-barangay');

      const modalLabel = document.getElementById('waterUsersModalLabel');
      const modalBody = document.getElementById('waterUsersModalBody');

      modalLabel.textContent = `Water Users in ${barangay}, ${city}`;
      modalBody.innerHTML = `<p class="text-muted">Loading...</p>`;

      try {
        const allUsers = await WUSData.fetchAll();
        const filteredUsers = allUsers.filter(user =>
          normalizeCity(user.city) === city &&
          normalizeBarangay(user.barangay) === barangay
        );

        if (filteredUsers.length === 0) {
          modalBody.innerHTML = `<p class="text-muted">No water users found for ${barangay}.</p>`;
        } else {
          let usersHtml = `
            <table class="table table-bordered table-striped align-middle text-center">
              <thead class="table-success">
                <tr>
                  <th>Owner</th>
                  <th>Street</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Permit No.</th>
                  <th>Type</th>
                  <th>Year Inspected</th>
                  <th>Is Water Source?</th>
                  <th>Geotagged Image</th>
                  <th>View Map</th>
                </tr>
              </thead>
              <tbody>
          `;

          filteredUsers.forEach(user => {
            usersHtml += `
              <tr>
                <td>${user.owner || '-'}</td>
                <td>${user.street || '-'}</td>
                <td>${user.latitude !== undefined && user.latitude !== null ? Number(user.latitude).toFixed(5) : '-'}</td>
                <td>${user.longitude !== undefined && user.longitude !== null ? Number(user.longitude).toFixed(5) : '-'}</td>
                <td>${user.permitNo || '-'}</td>
                <td>${user.type || '-'}</td>
                <td>${user.year_conducted || '-'}</td>
                <td>${user.isWaterSource ? 'Yes' : 'No'}</td>
                <td>
                  ${user.geotaggedUrl 
                    ? `<a href="${user.geotaggedUrl}" target="_blank" class="btn btn-sm btn-outline-secondary">View</a>` 
                    : '-' }
                </td>
                <td>
                  <button 
                    class="btn btn-3d btn-sm btn-outline-primary view-map-btn" 
                    data-id="${user.id}">
                    Show in Map
                  </button>
                </td>
              </tr>
            `;
          });

          usersHtml += `</tbody></table>`;
          modalBody.innerHTML = usersHtml;
        }

        const waterUsersModal = new bootstrap.Modal(document.getElementById('waterUsersModal'), {
          backdrop: false
        });
        waterUsersModal.show();

      } catch (err) {
        console.error(err);
        modalBody.innerHTML = `<p class="text-danger">Error loading water users.</p>`;
      }
    }

    // ✅ This part stays the same since handleViewUserMapClick() now gets the ID
    if (e.target.classList.contains('view-map-btn')) {
      await handleViewUserMapClick(e);
    }
  });
}

function attachViewMapListener() {
  document.querySelectorAll('.view-map-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const clickedCity = e.target.getAttribute('data-city');
      const normalizedClickedCity = normalizeCity(clickedCity);

      document.getElementById('mapModalLabel').textContent = `${clickedCity} Map`;

      const allData = await WUSData.fetchAll();
      const cachedPermits = await Permit.getAll();
      const cityEntries = allData.filter(entry => normalizeCity(entry.city) === normalizedClickedCity);

      clearExtraMarkers();

      if (cityEntries.length > 0) {
        const avgLat = cityEntries.reduce((sum, e) => sum + (parseFloat(e.latitude) || 0), 0) / cityEntries.length;
        const avgLng = cityEntries.reduce((sum, e) => sum + (parseFloat(e.longitude) || 0), 0) / cityEntries.length;

        updateMapLocation(clickedCity, avgLat, avgLng);

        for (const entry of cityEntries) {
          if (entry.latitude && entry.longitude) {
            const sourceStatus = (entry.isWaterSource === true || entry.isWaterSource === 'true')
              ? '<span style="color:blue; font-weight:bold;">Water Source</span>'
              : '<span style="color:green; font-weight:bold;">Not a Water Source</span>';

              const matchedPermitMeta = cachedPermits.find(p => p.permitNo === entry.permitNo);
              let pdfUrl = 'images/permitNotFound.png';

              if (matchedPermitMeta?.id) {
                try {
                  const fullPermit = await Permit.getById(matchedPermitMeta.id);
                  if (fullPermit?.pdfUrl) {
                    pdfUrl = fullPermit.pdfUrl;
                  }
                } catch (err) {
                  console.warn(`Failed to fetch permit by ID: ${matchedPermitMeta.id}`, err.message);
                }
              }

              let popupText = `
                <strong>${entry.permittee || entry.owner || 'Unknown Site'}</strong><br>
                🔢 <strong>Permit No.:</strong> 
                <a href="${pdfUrl}" target="_blank">${entry.permitNo || 'N/A'}</a><br>
                🏠 ${entry.street || 'Street not specified'}<br>
                📍 Lat: ${parseFloat(entry.latitude).toFixed(5)}, 
                Lng: ${parseFloat(entry.longitude).toFixed(5)}<br>
                📅 Year Inspected: ${entry.year_conducted || 'N/A'}<br>
                ✅ Status: ${sourceStatus}<br>
              `;

              if (entry.geotaggedUrl) {
                popupText += `
                  <div style="margin-top: 5px;">
                    <a href="${entry.geotaggedUrl}" target="_blank">
                      <img src="${entry.geotaggedUrl}" 
                          alt="Geotagged Photo" 
                          style="width: 120px; height: auto; border-radius: 6px; border: 1px solid #ccc;">
                    </a>
                  </div>
                `;
            }

            addMapMarker(
              entry.latitude,
              entry.longitude,
              popupText,
              entry.isWaterSource,
              entry.permitNo
            );
          }
        }
      } else {
        console.warn(`No entries found for "${clickedCity}"`);
      }
    });
  });
}

async function handleViewBarangayMapClick(event) {
  if (!event.target.classList.contains('view-map-btn')) return;

  const clickedCity = event.target.getAttribute('data-city');
  const clickedBarangay = event.target.getAttribute('data-barangay');

  const normalizedCity = normalizeCity(clickedCity);
  const normalizedBarangay = normalizeBarangay(clickedBarangay);

  document.getElementById('mapModalLabel').textContent = `${clickedBarangay}, ${clickedCity} Map`;

  const allData = await WUSData.fetchAll();
  const cachedPermits = await Permit.getAll(); // ✅ needed to find id

  const barangayEntries = allData.filter(entry => 
    normalizeCity(entry.city) === normalizedCity &&
    normalizeBarangay(entry.barangay) === normalizedBarangay
  );

  clearExtraMarkers();

  if (barangayEntries.length > 0) {
    const avgLat = barangayEntries.reduce((sum, e) => sum + (parseFloat(e.latitude) || 0), 0) / barangayEntries.length;
    const avgLng = barangayEntries.reduce((sum, e) => sum + (parseFloat(e.longitude) || 0), 0) / barangayEntries.length;

    updateMapLocation(`${normalizedBarangay}, ${normalizedCity}`, avgLat, avgLng);

    for (const entry of barangayEntries) {
      if (entry.latitude && entry.longitude) {

        const sourceStatus = (entry.isWaterSource === true || entry.isWaterSource === 'true')
          ? '<span style="color:blue; font-weight:bold;">Water Source</span>'
          : '<span style="color:green; font-weight:bold;">Not a Water Source</span>';

        // ✅ Lookup permit.id first, then fetch full doc
        const matchedPermitMeta = cachedPermits.find(p => p.permitNo === entry.permitNo);
        let pdfUrl = 'images/permitNotFound.png';

        if (matchedPermitMeta?.id) {
          try {
            const fullPermit = await Permit.getById(matchedPermitMeta.id);
            if (fullPermit?.pdfUrl) {
              pdfUrl = fullPermit.pdfUrl;
            }
          } catch (err) {
            console.warn(`Failed to fetch permit by ID: ${matchedPermitMeta.id}`, err.message);
          }
        }

        let popupText = `
          <strong>${entry.permittee || entry.owner || 'Unknown Site'}</strong><br>
          🔢 <strong>Permit No.:</strong> 
          <a href="${pdfUrl}" target="_blank">${entry.permitNo || 'N/A'}</a><br>
          🏠 ${entry.street || 'Street not specified'}<br>
          📍 Lat: ${parseFloat(entry.latitude).toFixed(5)}, 
          Lng: ${parseFloat(entry.longitude).toFixed(5)}<br>
          📅 Year Inspected: ${entry.year_conducted || 'N/A'}<br>
          ✅ Status: ${sourceStatus}<br>
        `;

        if (entry.geotaggedUrl) {
          popupText += `
            <div style="margin-top: 5px;">
              <a href="${entry.geotaggedUrl}" target="_blank">
                <img src="${entry.geotaggedUrl}" 
                    alt="Geotagged Photo" 
                    style="width: 120px; height: auto; border-radius: 6px; border: 1px solid #ccc;">
              </a>
            </div>
          `;
        }

        addMapMarker(
          entry.latitude,
          entry.longitude,
          popupText,
          entry.isWaterSource,
          entry.permitNo
        );
      }
    }

  } else {
    console.warn(`⚠️ No entries found for "${normalizedBarangay}, ${normalizedCity}"`);
  }

  const mapModalInstance = new bootstrap.Modal(document.getElementById('mapModal'));
  mapModalInstance.show();
}

async function handleViewUserMapClick(event) {
  if (!event.target.classList.contains('view-map-btn')) return;

  const entryId = event.target.getAttribute('data-id');

  const allData = await WUSData.fetchAll();
  const cachedPermits = await Permit.getAll(); // ✅ needed to find id

  const selectedEntry = allData.find(entry => entry.id === entryId);

  if (!selectedEntry) {
    console.warn(`⚠️ No entry found for ID: ${entryId}`);
    return;
  }

  const lat = parseFloat(selectedEntry.latitude);
  const lng = parseFloat(selectedEntry.longitude);

  document.getElementById('mapModalLabel').textContent =
    `${selectedEntry.owner || 'Unknown Site'} – ${selectedEntry.city || 'Unknown City'}`;

  clearExtraMarkers();

  updateMapLocation(
    `${selectedEntry.owner || 'Unknown Site'} – ${selectedEntry.city || 'Unknown City'}`,
    lat,
    lng
  );

  const sourceStatus = (selectedEntry.isWaterSource === true || selectedEntry.isWaterSource === 'true')
    ? '<span style="color:blue; font-weight:bold;">Water Source</span>'
    : '<span style="color:green; font-weight:bold;">Not a Water Source</span>';

  // ✅ Lookup permit.id first, then fetch full doc
  const matchedPermitMeta = cachedPermits.find(p => p.permitNo === selectedEntry.permitNo);
  let pdfUrl = 'images/permitNotFound.png';

  if (matchedPermitMeta?.id) {
    try {
      const fullPermit = await Permit.getById(matchedPermitMeta.id);
      if (fullPermit?.pdfUrl) {
        pdfUrl = fullPermit.pdfUrl;
      }
    } catch (err) {
      console.warn(`Failed to fetch permit by ID: ${matchedPermitMeta.id}`, err.message);
    }
  }

  let popupText = `
    <strong>${selectedEntry.permittee || selectedEntry.owner || 'Unknown Site'}</strong><br>
    🔢 <strong>Permit No.:</strong> 
    <a href="${pdfUrl}" target="_blank">${selectedEntry.permitNo || 'N/A'}</a><br>
    🏠 ${selectedEntry.street || 'Street not specified'}<br>
    📍 Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}<br>
    📅 Year Inspected: ${selectedEntry.year_conducted || 'N/A'}<br>
    ✅ Status: ${sourceStatus}<br>
  `;

  if (selectedEntry.geotaggedUrl) {
    popupText += `
      <div style="margin-top: 5px;">
        <a href="${selectedEntry.geotaggedUrl}" target="_blank">
          <img src="${selectedEntry.geotaggedUrl}" 
               alt="Geotagged Photo" 
               style="width: 120px; height: auto; border-radius: 6px; border: 1px solid #ccc;">
        </a>
      </div>
    `;
  }

  addMapMarker(lat, lng, popupText, selectedEntry.isWaterSource, selectedEntry.permitNo);

  const mapModalInstance = new bootstrap.Modal(document.getElementById('mapModal'));
  mapModalInstance.show();
}
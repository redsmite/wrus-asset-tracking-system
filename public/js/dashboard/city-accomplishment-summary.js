import { WUSData } from "../wrus/wrus-data.js";

export async function initCityAccomplishmentSummary() {
  const data = await WUSData.fetchAll();
  const container = document.getElementById('cityAccomplishmentTable');
  if (!container) return;

  const grouped = {};
  const barangayGrouped = {};

  let grandPermittees = 0;
  let grandNonPermittees = 0;
  let grandWaterSources = 0;

  function normalizeBarangay(brgy) {
    if (!brgy || brgy.trim() === '' || ['0', 'n/a', 'bgy', 'bgy.'].includes(brgy.toLowerCase())) {
      return 'Unknown';
    }
    return brgy
      .toLowerCase()
      .replace(/^(brgy\.?|barangay|bgy\.?|bgy)\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function normalizeCity(city) {
    if (!city || city.trim() === '' || city === '0' || city.toLowerCase() === 'n/a') {
      return 'Unknown';
    }
    return city
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  data.forEach(entry => {
    const city = normalizeCity(entry.city);
    const barangay = normalizeBarangay(entry.barangay);
    const hasPermit = !!entry.permitNo;
    const isOperational = entry.remarks?.toLowerCase() === 'operational';

    if (!grouped[city]) {
      grouped[city] = { permittees: 0, nonPermittees: 0, waterSources: 0 };
    }

    if (!barangayGrouped[city]) {
      barangayGrouped[city] = {};
    }

    if (!barangayGrouped[city][barangay]) {
      barangayGrouped[city][barangay] = { permittees: 0, nonPermittees: 0, waterSources: 0 };
    }

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
  const dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const cities = Object.keys(grouped).sort();

  let html = `
    <h3 class="mb-3">Accomplishment Per City — Water Users and Sources
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
          <button class="btn btn-3d btn-sm btn-outline-info view-barangay-btn" 
            data-city="${city}"
            data-bs-toggle="modal"
            data-bs-target="#barangayModal">
            View Barangays
          </button>
        </td>
      </tr>
    `;
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

  // Modal content handler
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.view-barangay-btn');
    if (!btn) return;

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
            <th rowspan="2" class="align-middle">Action</th>
          </tr>
          <tr>
            <th>Permittees</th>
            <th>Non-Permittees</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;

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
            data-city="${city}"
            data-barangay="${brgy}">
            View Users
          </button>
          </td>
        </tr>
      `;
    });

    const cityTotal = totalPermittees + totalNonPermittees;

    barangayHtml += `
        <tr class="table-secondary fw-bold">
          <td>Total</td>
          <td>${totalPermittees}</td>
          <td>${totalNonPermittees}</td>
          <td>${cityTotal}</td>
          <td>${totalSources}</td>
        </tr>
      </tbody>
      </table>
    `;

    modalBody.innerHTML = barangayHtml;
  });

  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.view-users-btn');
    if (!btn) return;

    const city = btn.getAttribute('data-city');
    const barangay = btn.getAttribute('data-barangay');

    const modalLabel = document.getElementById('waterUsersModalLabel');
    const modalBody = document.getElementById('waterUsersModalBody');

    modalLabel.textContent = `Water Users in ${barangay}, ${city}`;
    modalBody.innerHTML = `<p class="text-muted">Loading...</p>`; // temporary loading text

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
                <th>Year Conducted</th>
                <th>Is Water Source?</th>
                <th>Geotagged Image</th>
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
                  : '-'}
              </td>
            </tr>
          `;
        });

        usersHtml += `</tbody></table>`;
        modalBody.innerHTML = usersHtml;
      }

      // ✅ Manually open the water users modal without closing barangay modal
      const waterUsersModal = new bootstrap.Modal(document.getElementById('waterUsersModal'), {
        backdrop: false // ✅ prevents modal from dismissing the other
      });
      waterUsersModal.show();

    } catch (err) {
      console.error(err);
      modalBody.innerHTML = `<p class="text-danger">Error loading water users.</p>`;
    }
  });

}

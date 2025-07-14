import { Permit } from "../permit/permit-data.js";
import { METRO_MANILA_CITIES } from "../constants/metroManilaCities.js";


export async function filterPermitsByCity() {
  const allPermits = await Permit.getAll();

  const cityCounts = METRO_MANILA_CITIES.reduce((acc, city) => {
    const normalizedCity = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const matches = allPermits.filter(p => {
      const diversion = p.diversionPoint || "";
      const normalizedDiversion = diversion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const regex = new RegExp(`(?:^|\\W)${normalizedCity}(?:\\W|$)`, 'i');
      return regex.test(normalizedDiversion);
    });

    if (matches.length > 0) {
      const visitedCount = matches.filter(p => p.visited === true && p.cancelled !== true).length;
      const cancelledCount = matches.filter(p => p.cancelled === true).length;
      const validCount = matches.length - cancelledCount;
      const percent = validCount > 0 ? ((visitedCount / validCount) * 100).toFixed(2) : "0.00";

      acc.push({
        city,
        total: matches.length,
        visited: visitedCount,
        cancelled: cancelledCount,
        percent
      });
    }

    return acc;
  }, []);

  renderCityPermitTable(cityCounts);
}

function renderCityPermitTable(cityCounts) {
  const container = document.getElementById('cityPermitTable');
  if (!container) return;

  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Compute totals
  const totalPermits = cityCounts.reduce((sum, c) => sum + c.total, 0);
  const totalVisited = cityCounts.reduce((sum, c) => sum + c.visited, 0);
  const totalCancelled = cityCounts.reduce((sum, c) => sum + c.cancelled, 0);
  const validCount = totalPermits - totalCancelled;
  const totalPercent = validCount > 0 ? ((totalVisited / validCount) * 100).toFixed(2) : "0.00";

  let html = `
    <h3 class="mb-3">City / Municipality Permit Statistics <span class="fs-6 fw-normal"> — As of ${dateStr}</span></h3>
    <table class="table table-bordered table-striped align-middle text-center">
      <thead class="table-primary">
        <tr>
          <th>City / Municipality</th>
          <th>Total Permits</th>
          <th>Visited</th>
          <th>Cancelled</th>
          <th>Visited %</th>
        </tr>
      </thead>
      <tbody>
  `;

  cityCounts.forEach(({ city, total, visited, cancelled, percent }) => {
    html += `
      <tr>
        <td>${city}</td>
        <td>${total}</td>
        <td>${visited}</td>
        <td>${cancelled}</td>
        <td>
          <div class="city-progress-container">
            <div class="progress city-progress-bar" role="progressbar" title="${percent}% visited"
                aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar bg-info" style="width: ${percent}%"></div>
            </div>
            <div class="progress-text">${percent}%</div>
          </div>
        </td>
      </tr>
    `;
  });

  // Add Total row
  html += `
      <tr class="table-secondary fw-bold">
        <td>Total</td>
        <td>${totalPermits}</td>
        <td>${totalVisited}</td>
        <td>${totalCancelled}</td>
        <td>
          <div class="city-progress-container">
            <div class="progress city-progress-bar" role="progressbar" title="${totalPercent}% visited"
                aria-valuenow="${totalPercent}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar bg-info" style="width: ${totalPercent}%"></div>
            </div>
            <div class="progress-text">${totalPercent}%</div>
          </div>
        </td>
      </tr>
  `;

  html += `</tbody></table>`;
  container.innerHTML = html;
}

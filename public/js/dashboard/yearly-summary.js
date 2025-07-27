import { WUSData } from "../wrus/wrus-data.js";

export async function initYearlyWaterUserSummary() {
  const data = await WUSData.fetchAll();
  const container = document.getElementById('yearlyWaterUserSummary');
  if (!container) return;

  const grouped = {};
  let grandPermittees = 0;
  let grandNonPermittees = 0;
  let grandWaterSources = 0;

  data.forEach(entry => {
    const year = entry.year_conducted || 'Unknown';
    if (!grouped[year]) {
      grouped[year] = {
        permittees: 0,
        nonPermittees: 0,
        waterSources: 0
      };
    }

    const hasPermit = !!entry.permitNo;
    if (hasPermit) {
      grouped[year].permittees++;
      grandPermittees++;
    } else {
      grouped[year].nonPermittees++;
      grandNonPermittees++;
    }

    if (entry.remarks?.toLowerCase() === 'operational') {
      grouped[year].waterSources++;
      grandWaterSources++;
    }
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const years = Object.keys(grouped).sort((a, b) => a - b);

  let html = `
    <h3 class="mb-3">Yearly Accomplishment — Water Users and Sources 
      <span class="fs-6 fw-normal"> — As of ${dateStr}</span>
    </h3>
    <table class="table table-bordered table-striped align-middle text-center rounded-0">
      <thead class="table-success">
        <tr>
          <th rowspan="2">Year</th>
          <th colspan="3">Water Users</th>
          <th rowspan="2">Water Sources</th>
        </tr>
        <tr>
          <th>Permittees</th>
          <th>Non-Permittees</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
  `;

  years.forEach(year => {
    const { permittees, nonPermittees, waterSources } = grouped[year];
    const total = permittees + nonPermittees;

    html += `
      <tr>
        <td>${year}</td>
        <td>${permittees}</td>
        <td>${nonPermittees}</td>
        <td>${total}</td>
        <td>${waterSources}</td>
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
      </tr>
    </tbody>
  </table>`;

  container.innerHTML = html;
}
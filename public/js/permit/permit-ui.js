import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { Permit } from "./permit-data.js";
import { FileService } from "../upload/upload.js";
import { CoordinateUtils } from "../utils/coordinates.js";


export function initializePage(){
  Sidebar.render();
  Spinner.render();
  handleAddButton();
  handleAddFormSubmit();
  renderPermitTable();
    setupToggle(
    'toggleFilter',
    'filterSection',
    'Show Legend & Filter',
    'Hide Legend & Filter'
  );
}

function handleAddButton(){
  document.getElementById('addPermitBtn').addEventListener('click', () => {
    const permitModal = new bootstrap.Modal(document.getElementById('addPermitModal'));
    permitModal.show();
  });
}

function handleAddFormSubmit() {
  document.getElementById('savePermitBtn').addEventListener('click', async () => {
    Spinner.show();

    const form = document.getElementById('permitForm');

    // Form validation
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      Spinner.hide();
      return;
    }

    const visited = document.getElementById('visited').checked;
    const pdfFile = document.getElementById('pdfAttachment').files[0];

    let pdfUrl = null;

    // Upload PDF if present
    if (pdfFile) {
      pdfUrl = await FileService.uploadPermitFile(pdfFile);
      if (!pdfUrl) {
        Spinner.hide();
        return;
      }
    }

    // 🌐 Convert Latitude DMS to Decimal
    const latDegrees = parseFloat(document.getElementById('latDegrees').value) || 0;
    const latMinutes = parseFloat(document.getElementById('latMinutes').value) || 0;
    const latSeconds = parseFloat(document.getElementById('latSeconds').value) || 0;
    const latDirection = document.getElementById('latDirection').value;

    const latitude = CoordinateUtils.dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection);

    // 🌐 Convert Longitude DMS to Decimal
    const lonDegrees = parseFloat(document.getElementById('lonDegrees').value) || 0;
    const lonMinutes = parseFloat(document.getElementById('lonMinutes').value) || 0;
    const lonSeconds = parseFloat(document.getElementById('lonSeconds').value) || 0;
    const lonDirection = document.getElementById('lonDirection').value;

    const longitude = CoordinateUtils.dmsToDecimal(lonDegrees, lonMinutes, lonSeconds, lonDirection);

    const data = {
      permitNo: document.getElementById('permitNo').value.trim(),
      permittee: document.getElementById('permittee').value.trim(),
      mailingAddress: document.getElementById('mailingAddress').value.trim(),
      diversionPoint: document.getElementById('diversionPoint').value.trim(),
      latitude: latitude, // Decimal latitude
      longitude: longitude, // Decimal longitude
      waterSource: document.getElementById('waterSource').value.trim(),
      waterDiversion: document.getElementById('waterDiversion').value.trim(),
      flowRate: parseFloat(document.getElementById('flowRate').value) || 0,
      purpose: document.getElementById('purpose').value.trim(),
      periodOfUse: document.getElementById('periodOfUse').value.trim(),
      visited: visited,
      pdfUrl: pdfUrl || '',
      timestamp: new Date()
    };

    try {
      await Permit.add(data);
      renderPermitTable();
      alert('✅ Permit successfully added');

      // Reset form
      form.reset();
      form.classList.remove('was-validated');
      const modal = bootstrap.Modal.getInstance(document.getElementById('addPermitModal'));
      modal.hide();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
      console.error('Error:', error);
    } finally {
      Spinner.hide();
    }
  });
}

function setupToggle(buttonId, sectionId, labelShow, labelHide) {
  const button = document.getElementById(buttonId);
  const section = document.getElementById(sectionId);

  if (!button || !section) {
    console.error(`❌ setupToggle error: Check IDs "${buttonId}" or "${sectionId}" — one or both not found.`);
    return;
  }

  button.addEventListener('click', () => {
    const isHidden = section.style.display === 'none';

    section.style.display = isHidden ? 'block' : 'none';
    button.innerHTML = isHidden
      ? `<i class="bi bi-eye-slash"></i> ${labelHide}`
      : `<i class="bi bi-eye"></i> ${labelShow}`;
  });
}



async function renderPermitTable() {
  const tableBody = document.getElementById('permitTableBody');
  const searchBar = document.getElementById('searchBar');
  const visitedFilter = document.getElementById('visitedFilter');
  tableBody.innerHTML = '';

  try {
    const permits = await Permit.getAll();

    function renderRows(data) {
      tableBody.innerHTML = '';

      if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No data found</td></tr>`;
        return;
      }

      data.forEach((permit) => {
        const latitude = permit.latitude ? Number(permit.latitude).toFixed(5) : '';
        const longitude = permit.longitude ? Number(permit.longitude).toFixed(5) : '';

        const isVisited = permit.visited === true;
        const rowClass = isVisited ? 'table-success' : '';

        const row = document.createElement('tr');
        row.className = rowClass;

        row.innerHTML = `
          <td>${permit.permitNo || ''}</td>
          <td>${permit.permittee || ''}</td>
          <td>${permit.mailingAddress || ''}</td>
          <td>${permit.diversionPoint || ''}</td>
          <td>${latitude}</td>
          <td>${longitude}</td>
          <td>${permit.waterSource || ''}</td>
          <td>${permit.purpose || ''}</td>
          <td>
            <button class="btn btn-sm btn-warning" data-id="${permit.id}">
              <i class="bi bi-pencil-square"></i>
            </button>
            <a href="${permit.pdfUrl}" target="_blank" class="btn btn-sm btn-info">
              <i class="bi bi-eye-fill"></i>
            </a>
          </td>
        `;

        tableBody.appendChild(row);

        // ✅ Attach event listener directly after creating the button
        const editButton = row.querySelector('button[data-id]');
        editButton.addEventListener('click', () => {
          const permitId = editButton.getAttribute('data-id');
          const permitData = permits.find((p) => p.id === permitId);
          if (permitData) {
            populateEditModal(permitData);
            const editModal = new bootstrap.Modal(document.getElementById('editPermitModal'));
            editModal.show();
          }
        });

      });
    }

    // 🔥 Combined filter function
    function applyFilters() {
      const searchTerm = searchBar.value.trim().toLowerCase();
      const isVisitedChecked = visitedFilter.checked;

      const filtered = permits.filter((permit) => {
        const matchesSearch =
          (permit.permitNo && permit.permitNo.toLowerCase().includes(searchTerm)) ||
          (permit.permittee && permit.permittee.toLowerCase().includes(searchTerm)) ||
          (permit.mailingAddress && permit.mailingAddress.toLowerCase().includes(searchTerm)) ||
          (permit.diversionPoint && permit.diversionPoint.toLowerCase().includes(searchTerm));

        const matchesVisited = isVisitedChecked ? permit.visited === false : true;

        return matchesSearch && matchesVisited;
      });

      renderRows(filtered);
    }

    // ✅ Initial render (shows everything)
    applyFilters();

    // 🔍 Search input listener
    searchBar.addEventListener('input', applyFilters);

    // ✅ Visited checkbox listener
    visitedFilter.addEventListener('change', applyFilters);

  } catch (error) {
    console.error('❌ Error rendering permit table:', error.message);
    tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading data</td></tr>`;
  }
}

function populateEditModal(permit) {
  // Basic Info
  document.getElementById('editPermitNo').value = permit.permitNo || '';
  document.getElementById('editPermittee').value = permit.permittee || '';
  document.getElementById('editMailingAddress').value = permit.mailingAddress || '';
  document.getElementById('editDiversionPoint').value = permit.diversionPoint || '';

  // Parse Latitude (Decimal to DMS)
  if (permit.latitude) {
    const { degrees, minutes, seconds, direction } = CoordinateUtils.decimalToDMS(permit.latitude, 'lat');
    document.getElementById('editLatDegrees').value = degrees;
    document.getElementById('editLatMinutes').value = minutes;
    document.getElementById('editLatSeconds').value = seconds;
  }

  // Parse Longitude (Decimal to DMS)
  if (permit.longitude) {
    const { degrees, minutes, seconds, direction } = CoordinateUtils.decimalToDMS(permit.longitude, 'lon');
    document.getElementById('editLonDegrees').value = degrees;
    document.getElementById('editLonMinutes').value = minutes;
    document.getElementById('editLonSeconds').value = seconds;
  }

  // Technical Info
  document.getElementById('editWaterSource').value = permit.waterSource || '';
  document.getElementById('editWaterDiversion').value = permit.waterDiversion || '';
  document.getElementById('editFlowRate').value = permit.flowRate || '';
  document.getElementById('editPeriodOfUse').value = permit.periodOfUse || '';
  document.getElementById('editPurpose').value = permit.purpose || '';
}




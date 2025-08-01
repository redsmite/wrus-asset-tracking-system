import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { WUSData } from "../data/cache/wrus-data.js";
import { METRO_MANILA_CITIES } from "../data/constants/metroManilaCities.js";
import { initSignaturePad } from "./signature-pad-module.js";
import { NotificationBox,Confirmation } from "../components/notification.js";

export function initializePage() {
  Sidebar.render();
  Spinner.render();
  initForm();
  initDynamicPlusButtons();
  initSignaturePad();
  finalizeButtonHandler();
  initEditWaterInventoryFormListener();
}

let editingIndex = null;
let itemCount = 0;

function initForm() {
  const citySelect = document.getElementById("citySelect");
  const yearInput = document.getElementById("yearConducted");

  if (citySelect) {
    METRO_MANILA_CITIES.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
  }

  if (yearInput) {
    const currentYear = new Date().getFullYear();
    yearInput.value = currentYear;
  }
}

function initDynamicPlusButtons() {
  const itemContainer = document.getElementById('itemContainer');
  const modalForm = document.getElementById('modalForm');
  const modalElement = document.getElementById('addModal');

  // ✅ Always reuse same modal instance (no stacking)
  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

  // ✅ Initialize localStorage if empty
  if (!localStorage.getItem('waterInventory')) {
    localStorage.setItem('waterInventory', JSON.stringify([]));
  }

  // ✅ Load saved data & count items
  let savedData = JSON.parse(localStorage.getItem('waterInventory'));
  itemCount = savedData.length;

  // ✅ Clear container so we don’t double-render icons
  itemContainer.innerHTML = '';

  // ✅ Render all saved entries as file icons
  savedData.forEach((item, index) => {
    const fileDiv = document.createElement('div');
    fileDiv.innerHTML = `
      <a href="#" class="file-link" data-index="${index}" 
         data-bs-toggle="modal" data-bs-target="#editModal">
        <i class="bi bi-file-earmark"></i>
        <span class="file-number">${index + 1}</span>
      </a>
    `;
    itemContainer.appendChild(fileDiv);
  });

  // ✅ Add the last “plus” button
  const plusDiv = document.createElement('div');
  plusDiv.innerHTML = `
    <button id="addWaterBtn" class="btn btn-primary big-plus-btn" 
            data-bs-toggle="modal" data-bs-target="#addModal">
      <i class="bi bi-file-earmark-plus"></i>
    </button>
  `;
  itemContainer.appendChild(plusDiv);

  // ✅ Attach event listener to the + button
  document.getElementById('addWaterBtn').addEventListener('click', () => {
    autoPopulateAddModal(); // 🔵 Populate modal when clicked
  });

  // ✅ Attach edit listeners to each file icon
  const fileLinks = itemContainer.querySelectorAll('.file-link');
  fileLinks.forEach(link => {
    link.addEventListener('click', function () {
      const index = parseInt(this.dataset.index);
      editingIndex = index;
      populateEditModal(index);
    });
  });

  // ✅ Prevent multiple submit listeners for the ADD form
  if (!modalForm.dataset.listenerAttached) {
    modalForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // ✅ Gather form data
      const formData = {};
      for (let element of modalForm.elements) {
        if (element.id && element.type !== 'submit' && element.type !== 'button') {
          if (element.type === 'checkbox') {
            formData[element.id] = element.checked;
          } else {
            formData[element.id] = element.value;
          }
        }
      }

      // 📦 Reload latest data
      let savedData = JSON.parse(localStorage.getItem('waterInventory'));

      if (editingIndex !== null) {
        savedData[editingIndex] = formData;
        editingIndex = null;
      } else {
        savedData.push(formData);
      }

      // 💾 Save updated data
      localStorage.setItem('waterInventory', JSON.stringify(savedData));

      // 🔁 Re-render icons
      initDynamicPlusButtons();

      // ✅ Reset form & close modal (reused instance)
      modalForm.reset();
      modal.hide();
    });

    modalForm.dataset.listenerAttached = "true";
  }
}

function autoPopulateAddModal() {
  // 🎯 Grab values from info-box section
  const selectedCity = document.getElementById('citySelect')?.value || '';
  const barangay = document.getElementById('barangayInput')?.value || '';
  const yearConducted = document.getElementById('yearConducted')?.value || '';

  // 🎯 Grab fields inside the Add Modal
  const modalYear = document.getElementById('modalYearConducted');
  const modalCity = document.getElementById('modalCity');
  const modalBarangay = document.getElementById('modalBarangay');

  // ✅ Fill modal fields (disable or not depending on your design)
  if (modalYear) modalYear.value = yearConducted;
  if (modalCity) modalCity.value = selectedCity;
  if (modalBarangay) modalBarangay.value = barangay;
}


function populateEditModal(index) {
  const savedData = JSON.parse(localStorage.getItem('waterInventory'));
  const record = savedData[index];

  // 🔢 Store the array index for later submission
  document.getElementById('editIndex').value = index;

  // 🏷 Fill each field (check if it exists before assigning)
  document.getElementById('editYearConducted').value = record.modalYearConducted || '';
  document.getElementById('editOwner').value = record.modalOwner || '';
  document.getElementById('editLocation').value = record.modalLocation || '';
  document.getElementById('editCity').value = record.modalCity || '';
  document.getElementById('editBarangay').value = record.modalBarangay || '';
  document.getElementById('editSourceWaterSelect').value = record.modalSourceWaterSelect || '';
  document.getElementById('editLatitude').value = record.modalLatitude || '';
  document.getElementById('editLongitude').value = record.modalLongitude || '';
  document.getElementById('editIsWaterSource').checked = record.modalIsWaterSource || false;
  document.getElementById('editPurposeSelect').value = record.modalPurposeSelect || '';
  document.getElementById('editRemarks').value = record.modalRemarks || '';
  document.getElementById('editRepresentative').value = record.modalRepresentative || '';

  // 🖊️ Signature handling (if you saved signature image data)
  if (record.modalSignature) {
    document.getElementById('editSignature').value = record.modalSignature;
    // ✅ Optional: draw signature on the canvas if needed
  }
}

function initEditWaterInventoryFormListener() {
  const editForm = document.getElementById('editModalForm'); // ✅ FIXED ID
  if (!editForm) return;

  // ✅ Prevent duplicate listeners
  if (editForm.dataset.listenerAttached) return;

  editForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // 📦 Get saved data from localStorage
    let savedData = JSON.parse(localStorage.getItem('waterInventory')) || [];

    // 🔢 Grab index from hidden input
    const index = parseInt(document.getElementById('editIndex').value, 10);

    // ✅ Collect updated values from edit modal
    const updatedRecord = {
      modalYearConducted: document.getElementById('editYearConducted').value,
      modalOwner: document.getElementById('editOwner').value,
      modalLocation: document.getElementById('editLocation').value,
      modalCity: document.getElementById('editCity').value,
      modalBarangay: document.getElementById('editBarangay').value,
      modalSourceWaterSelect: document.getElementById('editSourceWaterSelect').value,
      modalLatitude: document.getElementById('editLatitude').value,
      modalLongitude: document.getElementById('editLongitude').value,
      modalIsWaterSource: document.getElementById('editIsWaterSource').checked,
      modalPurposeSelect: document.getElementById('editPurposeSelect').value,
      modalRemarks: document.getElementById('editRemarks').value,
      modalRepresentative: document.getElementById('editRepresentative').value,
      modalSignature: document.getElementById('editSignature').value
    };

    // 🔄 Update that specific record
    savedData[index] = updatedRecord;

    // 💾 Save updated array back to localStorage
    localStorage.setItem('waterInventory', JSON.stringify(savedData));

    // 🔁 Refresh your UI (re-renders icons and plus button)
    initDynamicPlusButtons();

    // ✅ Close the edit modal (✅ FIXED ID)
    const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    editModal.hide();
  });

  // ✅ Mark listener attached so it won’t duplicate
  editForm.dataset.listenerAttached = "true";
}

function finalizeButtonHandler() {
  const btn = document.getElementById('finalizeButton');

  btn.addEventListener('click', () => {
    // 🔔 Ask user before pushing data
    Confirmation.show(
      "⚠️ Are you sure you want to send ALL water inventory data to the database?",
      async (confirmed) => {
        if (!confirmed) return;

        const localData = JSON.parse(localStorage.getItem('waterInventory') || '[]');

        if (localData.length === 0) {
          NotificationBox.show("📭 No water inventory data found in localStorage.");
          return;
        }

        // 🚀 Show spinner
        Spinner.show();
        btn.disabled = true;

        console.log(`📦 Sending ${localData.length} records to Firestore...`);

        try {
          for (const item of localData) {
            const payload = {
              year_conducted: item.modalYearConducted || "",
              owner: item.modalOwner || "",
              street: item.modalLocation || "",
              city: item.modalCity || "",
              barangay: item.modalBarangay || "",
              type: item.modalSourceWaterSelect || "",
              latitude: item.modalLatitude || "",
              longitude: item.modalLongitude || "",
              isWaterSource: item.modalIsWaterSource || false,
              remarks: combineRemarks(item.modalPurposeSelect, item.modalRemarks),
              representative: item.modalRepresentative || "",
              signUrl: item.modalSignature || ""
            };

            await WUSData.add(payload);
            console.log(`✅ Added: ${item.modalOwner} (${item.modalYearConducted})`);
          }

          // 🧹 Clear local storage
          localStorage.removeItem('waterInventory');
          console.log("🧹 Local storage 'waterInventory' cleared.");
          NotificationBox.show("All water inventory data has been successfully sent!");

        } catch (err) {
          console.error("❌ Error while sending data:", err);
          NotificationBox.show("An error occurred while sending the data. Please try again.");
        } finally {
          // Hide spinner and re-enable button
          Spinner.hide();
          btn.disabled = false;
        }
      }
    );
  });
}

// 🔧 Helper for remarks (Purpose + Remarks combined)
function combineRemarks(purpose, remarks) {
  if (purpose && remarks) return `${purpose}: ${remarks}`;
  if (purpose) return purpose;
  if (remarks) return remarks;
  return "";
}



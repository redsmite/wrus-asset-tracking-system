import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { WUSData } from "../data/cache/wrus-data.js";
import { METRO_MANILA_CITIES } from "../data/constants/metroManilaCities.js";
import { months } from "../data/constants/months.js";
import { waterSources } from "../data/constants/waterSources.js";
import { purpose } from "../data/constants/purpose.js";
import { initSignaturePad } from "./signature-pad-module.js";
import { saveSignatureToIndexedDB, getSignatureFromIndexedDB, clearSignaturesFromIndexedDB, deleteSignatureFromIndexedDB } from './indexeddb-signature.js';
import { NotificationBox,Confirmation } from "../components/notification.js";
import { uploadSignatureToSupabase } from "../upload/uploadImg.js";

export function initializePage() {
  Sidebar.render();
  Spinner.render();
  initDynamicPlusButtons();
  populateMonthSelect('monthConducted');
  populateMonthSelect('monthConductedAddModal');
  populateMonthSelect('monthConductedEditModal');
  initForm();
  waterSourceSelectModal('modalSourceWaterSelect');
  waterSourceSelectModal('editSourceWaterSelect');
  populatePurposeSelect('modalPurposeSelect');
  populatePurposeSelect('editPurposeSelect');
  initSignaturePad({
    canvasId: "signatureCanvas",
    clearBtnId: "clearSignature",
    hiddenInputId: "modalSignature",
    formId: "modalForm",
    modalIds: ["addModal"]
  });
  finalizeButtonHandler();
  clearAll();
  initEditWaterInventoryFormListener();
  console.log(localStorage.getItem('waterInventory'));
}

let editingIndex = null;
let itemCount = 0;

function initForm() {
  const citySelect = document.getElementById("citySelect");
  const yearInput = document.getElementById("yearConducted");
  const monthSelect = document.getElementById("monthConducted");

  // Populate cities
  if (citySelect) {
    METRO_MANILA_CITIES.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
  }

  // Set current year
  if (yearInput) {
    const currentYear = new Date().getFullYear();
    yearInput.value = currentYear;
  }

  // Populate months
  if (monthSelect) {
    const currentMonthIndex = new Date().getMonth();
    months.forEach((month, index) => {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = month;
      if (index === currentMonthIndex) {
        option.selected = true;
      }
      monthSelect.appendChild(option);
    });
  }
}

function initDynamicPlusButtons() {
  const itemContainer = document.getElementById('itemContainer');
  const modalForm = document.getElementById('modalForm');
  const modalElement = document.getElementById('addModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

  if (!localStorage.getItem('waterInventory')) {
    localStorage.setItem('waterInventory', JSON.stringify([]));
  }

  let savedData = JSON.parse(localStorage.getItem('waterInventory'));
  itemCount = savedData.length;

  itemContainer.innerHTML = '';

  savedData.forEach((item, index) => {
    const fileDiv = document.createElement('div');
    fileDiv.classList.add('entry-wrapper', 'text-center');

    fileDiv.innerHTML = `
      <a href="#" class="btn-3d file-link mb-2" data-index="${index}" 
         data-bs-toggle="modal" data-bs-target="#editModal">
        <i class="bi bi-file-earmark"></i>
        <span class="file-number">${index + 1}</span>
      </a>
      <button class="btn btn-3d btn-danger btn-lg mt-2 delete-entry-btn" data-id="${item.id}">
        <i class="bi bi-dash-circle"></i>
      </button>
    `;

    itemContainer.appendChild(fileDiv);
  });

  const plusDiv = document.createElement('div');
  plusDiv.innerHTML = `
    <button id="addWaterBtn" class="btn btn-primary big-plus-btn mt-3" 
            data-bs-toggle="modal" data-bs-target="#addModal">
      <i class="bi bi-file-earmark-plus"></i>
    </button>
  `;
  itemContainer.appendChild(plusDiv);

  document.getElementById('addWaterBtn').addEventListener('click', () => {
    editingIndex = null;
    autoPopulateAddModal();
  });

  const fileLinks = itemContainer.querySelectorAll('.file-link');
  fileLinks.forEach(link => {
    link.addEventListener('click', function () {
      const index = parseInt(this.dataset.index);
      editingIndex = index;
      populateEditModal(index);
    });
  });

  // ✅ Attach Delete Button Logic
  attachDeleteButtonListeners();

  // ✅ Attach Form Submit Listener (only once)
  handleModalFormSubmit(modalForm, modal);
}

function handleModalFormSubmit(modalForm, modal) {
  if (modalForm.dataset.listenerAttached) return;

  modalForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {};
    let signatureDataURL = null;

    // 🔄 Collect form data
    for (let element of modalForm.elements) {
      if (element.id && element.type !== 'submit' && element.type !== 'button') {
        formData[element.id] = element.type === 'checkbox' ? element.checked : element.value;
      }
    }

    // ✍️ Get signature from canvas
    const canvas = document.getElementById('signatureCanvas');
    if (canvas) {
      signatureDataURL = canvas.toDataURL();
    }

    let savedData = JSON.parse(localStorage.getItem('waterInventory')) || [];
    let recordId = null;

    // 📝 Determine if editing or adding new
    if (
      typeof editingIndex === 'number' &&
      editingIndex >= 0 &&
      editingIndex < savedData.length
    ) {
      formData.id = savedData[editingIndex]?.id || generateUniqueId();
      savedData[editingIndex] = formData;
      recordId = formData.id;
      editingIndex = null;
    } else {
      recordId = generateUniqueId();
      formData.id = recordId;
      savedData.push(formData);
    }

    // 💾 Save updated data to localStorage
    localStorage.setItem('waterInventory', JSON.stringify(savedData));

    // 💾 Save signature to IndexedDB
    if (signatureDataURL) {
      try {
        await saveSignatureToIndexedDB(signatureDataURL, recordId);
      } catch (err) {
        console.error("Error saving signature:", err);
      }
    }

    // 🔄 Refresh UI and reset modal
    initDynamicPlusButtons();
    modalForm.reset();
    modal.hide();
  });

  modalForm.dataset.listenerAttached = "true";
}

function generateUniqueId() {
  const now = new Date();
  return 'id-' + now.toISOString().replace(/[-:.TZ]/g, '') + '-' + Math.random().toString(36).substr(2, 5);
}

function attachDeleteButtonListeners() {
  const deleteBtns = document.querySelectorAll('.delete-entry-btn');

  deleteBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.dataset.id; // use unique id instead of index

      Confirmation.show(
        `Are you sure you want to delete this entry?`,
        async (confirmed) => {
          if (!confirmed) return;

          Spinner.show();

          try {
            let savedData = JSON.parse(localStorage.getItem('waterInventory')) || [];
            const newData = savedData.filter(entry => entry.id !== id);
            localStorage.setItem('waterInventory', JSON.stringify(newData));

            await deleteSignatureFromIndexedDB(id);

            initDynamicPlusButtons();
            console.log(`🗑 Entry with ID ${id} deleted.`);
          } catch (err) {
            console.error("Error deleting entry:", err);
            NotificationBox.show("Failed to delete entry. Please try again.", "error");
          } finally {
            Spinner.hide();
          }
        }
      );
    });
  });
}

function populateMonthSelect(selectID) {
  const selectEl = document.getElementById(selectID);

  selectEl.innerHTML = '';

  // Optional default
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select month...';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  selectEl.appendChild(defaultOption);

  months.forEach(purpose => {
    const option = document.createElement('option');
    option.value = purpose;
    option.textContent = purpose.replace(' Use', ''); // Optional: remove ' Use' from label
    selectEl.appendChild(option);
  });
}

function autoPopulateAddModal() {
  const selectedCity = document.getElementById('citySelect')?.value || '';
  const barangay = document.getElementById('barangayInput')?.value || '';
  const yearConducted = document.getElementById('yearConducted')?.value || '';
  const monthConducted = document.getElementById('monthConducted')?.value || '';

  const modalYear = document.getElementById('modalYearConducted');
  const modalCity = document.getElementById('modalCity');
  const modalBarangay = document.getElementById('modalBarangay');
  const modalMonth = document.getElementById('monthConductedAddModal');

  if (modalYear) modalYear.value = yearConducted;
  if (modalCity) modalCity.value = selectedCity;
  if (modalBarangay) modalBarangay.value = barangay;
  if (modalMonth) modalMonth.value = monthConducted;
}

async function populateEditModal(index) {
  const savedData = JSON.parse(localStorage.getItem('waterInventory'));
  const record = savedData[index];
  const id = record.id;

  document.getElementById('editIndex').value = index;

  document.getElementById('editYearConducted').value = record.modalYearConducted || '';
  document.getElementById('monthConductedEditModal').value = record.monthConductedAddModal || '';
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

  // 🖼 Load and display the signature image
  const imageSignature = document.getElementById('image-signature');
  if (imageSignature && id) {
    try {
      const signatureDataURL = await getSignatureFromIndexedDB(id);
      if (signatureDataURL) {
        imageSignature.src = signatureDataURL;
        imageSignature.style.display = "block"; // Ensure it's visible
      } else {
        imageSignature.src = '';
        imageSignature.style.display = "none"; // Hide if not found
      }
    } catch (err) {
      console.error("Error loading signature image:", err);
      imageSignature.src = '';
      imageSignature.style.display = "none";
    }
  }
}

function waterSourceSelectModal(selectID){
  const selectEl = document.getElementById(selectID);

  selectEl.innerHTML = '';

  // Optional default
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Choose source...';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  selectEl.appendChild(defaultOption);

  // Dynamically add the options
  waterSources.forEach(source => {
    const option = document.createElement('option');
    option.value = source;
    option.textContent = source;
    selectEl.appendChild(option);
  });
}

function populatePurposeSelect(selectID) {
  const selectEl = document.getElementById(selectID);

  selectEl.innerHTML = '';

  // Optional default
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select purpose...';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  selectEl.appendChild(defaultOption);

  purpose.forEach(purpose => {
    const option = document.createElement('option');
    option.value = purpose;
    option.textContent = purpose.replace(' Use', ''); // Optional: remove ' Use' from label
    selectEl.appendChild(option);
  });
}

function initEditWaterInventoryFormListener() {
  const editForm = document.getElementById('editModalForm');
  if (!editForm) return;

  if (editForm.dataset.listenerAttached) return;

  editForm.addEventListener('submit', function (e) {
    e.preventDefault();

    let savedData = JSON.parse(localStorage.getItem('waterInventory')) || [];

    const index = parseInt(document.getElementById('editIndex').value, 10);

    const existingId = savedData[index].id;

    const updatedRecord = {
      id: existingId,
      modalYearConducted: document.getElementById('editYearConducted').value,
      monthConductedAddModal: document.getElementById('monthConductedEditModal').value,
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
    };

    savedData[index] = updatedRecord;

    localStorage.setItem('waterInventory', JSON.stringify(savedData));

    initDynamicPlusButtons();

    const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    editModal.hide();
  });

  editForm.dataset.listenerAttached = "true";
}

function clearAll() {
  const btn = document.getElementById('clearBtn');

  btn.addEventListener('click', () => {
    Confirmation.show(
      "Are you sure you want to CLEAR all water inventory data from the cache? This action cannot be undone.",
      async (confirmed) => {
        if (!confirmed) return;

        Spinner.show();

        try {
          // Clear local storage
          localStorage.removeItem('waterInventory');

          // Clear IndexedDB
          await clearSignaturesFromIndexedDB();

          initDynamicPlusButtons();

          console.log("🧹 All water inventory and signature data cleared.");
          NotificationBox.show("All water inventory and signature data have been cleared.");
        } catch (err) {
          console.error("Error clearing data:", err);
          NotificationBox.show("Failed to clear data. Please try again.", "error");
        } finally {
          Spinner.hide();
        }
      }
    );
  });
}

function finalizeButtonHandler() {
  const btn = document.getElementById('finalizeButton');

  btn.addEventListener('click', () => {
    Confirmation.show(
      "Are you sure you want to send ALL water inventory data to the database?",
      async (confirmed) => {
        if (!confirmed) return;

        const localData = JSON.parse(localStorage.getItem('waterInventory') || '[]');
        if (localData.length === 0) {
          NotificationBox.show("📭 No water inventory data found in localStorage.", "error");
          return;
        }

        Spinner.show();
        btn.disabled = true;

        try {
          for (const item of localData) {
            let signUrl = "";

            try {
              const signatureDataURL = await getSignatureFromIndexedDB(item.id); // ✅ Match by ID
              if (signatureDataURL) {
                const fileName = `signature-${item.modalOwner || "unknown"}-${Date.now()}.png`;
                signUrl = await uploadSignatureToSupabase(signatureDataURL, fileName);
              }
            } catch (uploadErr) {
              console.error("Failed to upload signature:", uploadErr);
            }

            const payload = {
              year_conducted: item.modalYearConducted || "",
              month_conducted: item.monthConductedAddModal || "",
              owner: item.modalOwner || "",
              street: item.modalLocation || "",
              city: item.modalCity || "",
              barangay: item.modalBarangay || "",
              type: item.modalSourceWaterSelect || "",
              latitude: item.modalLatitude || "",
              longitude: item.modalLongitude || "",
              isWaterSource: item.modalIsWaterSource || false,
              purpose: item.modalPurposeSelect || "",
              remarks: item.modalRemarks,
              representative: item.modalRepresentative || "",
              signUrl
            };

            await WUSData.add(payload);
          }

          localStorage.removeItem('waterInventory');

          // ✅ Clear all signatures from IndexedDB
          await clearSignaturesFromIndexedDB();

          NotificationBox.show("All water inventory data has been successfully sent!");
          initDynamicPlusButtons();

        } catch (err) {
          console.error("❌ Error while sending data:", err);
          NotificationBox.show("An error occurred while sending the data. Please try again.", "error");
        } finally {
          Spinner.hide();
          btn.disabled = false;
        }
      }
    );
  });
}
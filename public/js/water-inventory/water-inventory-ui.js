import { Sidebar } from "../components/sidebar.js";
import { METRO_MANILA_CITIES } from "../data/constants/metroManilaCities.js";
import { initSignaturePad } from "./signature-pad-module.js";

export function initializePage() {
  Sidebar.render();
  initForm();
  initDynamicPlusButtons();
  populateModalFields();
  initSignaturePad();
}
export function initForm() {
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

let editingIndex = null;
let itemCount = 0;

function initDynamicPlusButtons() {
  const itemContainer = document.getElementById('itemContainer');
  const modalForm = document.getElementById('modalForm');
  const modal = new bootstrap.Modal(document.getElementById('exampleModal'));

  // 🗂 Ensure localStorage array exists
  if (!localStorage.getItem('waterInventory')) {
    localStorage.setItem('waterInventory', JSON.stringify([]));
  }

  modalForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // ✅ Get all form data into an object
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

    // 📦 Retrieve the current array from localStorage
    let savedData = JSON.parse(localStorage.getItem('waterInventory'));

    if (editingIndex !== null) {
      // 🔄 Edit existing entry
      savedData[editingIndex] = formData;
      editingIndex = null; // reset edit state
    } else {
      // ➕ Add new entry
      savedData.push(formData);
      itemCount++;
    }

    // 💾 Save back to localStorage
    localStorage.setItem('waterInventory', JSON.stringify(savedData));

    // 🎯 Replace plus button with file link
    const plusBtn = itemContainer.querySelector('button[data-bs-toggle="modal"]');
    if (plusBtn) {
      plusBtn.parentElement.innerHTML = `
        <a href="#" class="file-link" data-index="${savedData.length - 1}">
          <i class="bi bi-file-earmark"></i>
          <span class="file-number">${itemCount}</span>
        </a>
      `;

      // 🆕 Add a new plus button
      const newDiv = document.createElement('div');
      newDiv.innerHTML = `
        <button class="btn btn-primary big-plus-btn" data-bs-toggle="modal" data-bs-target="#exampleModal">
          <i class="bi bi-file-earmark-plus"></i>
        </button>
      `;
      itemContainer.appendChild(newDiv);
    }

    modalForm.reset();
    modal.hide();
  });
}

function populateModalFields() {
  document.getElementById('exampleModal').addEventListener('show.bs.modal', function () {
    // ✅ Grab values from the main form
    const year = document.getElementById('yearConducted').value;
    const city = document.getElementById('citySelect').value;
    const barangay = document.getElementById('barangayInput').value;

    // ✅ Populate the modal’s disabled fields
    document.getElementById('modalYearConducted').value = year;
    document.getElementById('modalCity').value = city;
    document.getElementById('modalBarangay').value = barangay;
  });
}

function setupEditHandler() {
  const itemContainer = document.getElementById('itemContainer');

  itemContainer.addEventListener('click', function (e) {
    const link = e.target.closest('.file-link'); // look for the closest .file-link
    if (!link) return;

    e.preventDefault(); // stop default <a> behavior

    const index = link.dataset.index;
    editEntry(index);
  });
}

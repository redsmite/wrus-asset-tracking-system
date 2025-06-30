import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { Permit } from "./permit-data.js";
import { FileService } from "../upload/upload.js";


export function initializePage(){
  Sidebar.render();
  Spinner.render();
  handleAddButton();
  handleAddFormSubmit();
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

    // Check validity
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      Spinner.hide();
      return;
    }

    const visited = document.getElementById('visited').checked;
    const pdfFile = document.getElementById('pdfAttachment').files[0];

    let pdfUrl = null;

    // Upload PDF if file is selected
    if (pdfFile) {
      pdfUrl = await FileService.uploadPermitFile(pdfFile);
      if (!pdfUrl) {
        Spinner.hide();
        return; // Stop if upload fails
      }
    }

    const data = {
      permitNo: document.getElementById('permitNo').value.trim(),
      permittee: document.getElementById('permittee').value.trim(),
      mailingAddress: document.getElementById('mailingAddress').value.trim(),
      diversionPoint: document.getElementById('diversionPoint').value.trim(),
      latitude: document.getElementById('latitude').value.trim(),
      longitude: document.getElementById('longitude').value.trim(),
      waterSource: document.getElementById('waterSource').value.trim(),
      waterDiversion: document.getElementById('waterDiversion').value.trim(),
      flowRate: parseFloat(document.getElementById('flowRate').value) || 0,
      periodOfUse: document.getElementById('periodOfUse').value.trim(),
      visited: visited,
      pdfUrl: pdfUrl || '', // Store PDF URL or empty if none
      timestamp: new Date()
    };

    try {
      await Permit.add(data);
      alert('✅ Permit successfully added');

      // Reset form and close modal
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


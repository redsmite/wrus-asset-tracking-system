import { fetchConsumables,addConsumable,updateConsumable, addStock } from "./consumable-data.js";

document.addEventListener("DOMContentLoaded", () => {
  const showFormBtn = document.getElementById("showAddFormBtn");
  const addItemBtn = document.getElementById("addItemBtn");

  showFormBtn.addEventListener("click", () => {
    document.getElementById("addItemForm").classList.toggle("d-none");
  });

  addItemBtn.addEventListener("click", async () => {
    const spec = document.getElementById("newSpec").value.trim();
    const qty = document.getElementById("newQty").value.trim();
    const unit = document.getElementById("newUnit").value.trim();
    const addedBy = localStorage.getItem("userFullName") || "Unknown";

    if (spec && qty && unit) {
      await addConsumable(spec, qty, unit, addedBy);

      // Clear form
      newSpec.value = "";
      newQty.value = "";
      newUnit.value = "";
      addItemForm.classList.add("d-none");

      // Reload table
      renderConsumableTable();
    }
  });
});

async function renderConsumableTable() {
  const tbody = document.getElementById("consumableBody");
  tbody.innerHTML = "";

  const items = await fetchConsumables();

  items.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
  <td>${item.id}</td>
  <td>${item.specification}</td>
  <td>${item.qty}</td>
  <td>${item.unit}</td>
  <td>${item.timestamp}</td>
  <td>${item.addedBy}</td>
  <td>
    <button class="btn btn-warning btn-sm edit-btn" data-id="${item.id}" data-spec="${item.specification}" data-unit="${item.unit}" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
  </td>
  <td>
    <button class="btn btn-secondary btn-sm action-btn" data-id="${item.id}" data-qty="${item.qty}" data-bs-toggle="modal" data-bs-target="#actionModal">Action</button>
  </td>
    `;
    tbody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderConsumableTable();
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const cid = e.target.dataset.id;
    const spec = e.target.dataset.spec;
    const unit = e.target.dataset.unit;

    document.getElementById("editCID").value = cid;
    document.getElementById("editSpec").value = spec;
    document.getElementById("editUnit").value = unit;
  }
});

document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const cid = document.getElementById("editCID").value;
  const spec = document.getElementById("editSpec").value.trim();
  const unit = document.getElementById("editUnit").value.trim();

  if (spec && unit) {
    await updateConsumable(cid, { specification: spec, unit: unit });
    const modal = bootstrap.Modal.getInstance(document.getElementById("editModal"));
    modal.hide();
    renderConsumableTable();
  }
});

let selectedCID = null;

document.addEventListener("click", (e) => {
  // Detect clicks on the Action button
  if (e.target.classList.contains("action-btn")) {
    selectedCID = e.target.dataset.id;
  }
});

// Modal button handlers
document.getElementById("addStockBtn").addEventListener("click", () => {
  //alert("Add stock to CID: " + selectedCID);
  // TODO: Open add stock form/modal
});

document.getElementById("assignItemBtn").addEventListener("click", () => {
  //alert("Assign item from CID: " + selectedCID);
  // TODO: Open assign item form/modal
});

document.getElementById("viewLedgerBtn").addEventListener("click", () => {
  //alert("View ledger for CID: " + selectedCID);
  // TODO: Show ledger page/modal
});

let currentQty = 0;

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("action-btn")) {
    selectedCID = e.target.dataset.id;
    currentQty = parseInt(e.target.dataset.qty || "0");
  }
});

document.getElementById("addStockBtn").addEventListener("click", () => {
  const actionModal = bootstrap.Modal.getInstance(document.getElementById("actionModal"));
  actionModal.hide();
  const addStockModal = new bootstrap.Modal(document.getElementById("addStockModal"));
  document.getElementById("stockAmount").value = "";
  addStockModal.show();
});

document.getElementById("confirmAddStockBtn").addEventListener("click", async () => {
  const amount = parseInt(document.getElementById("stockAmount").value);
  if (!amount || amount <= 0 || !selectedCID) return alert("Invalid amount.");

  try {
    await addStock(selectedCID, amount);
    const modal = bootstrap.Modal.getInstance(document.getElementById("addStockModal"));
    modal.hide();
    renderConsumableTable();
  } catch (err) {
    console.error("Error adding stock:", err.message);
    alert("Something went wrong. Please try again.");
  }
});





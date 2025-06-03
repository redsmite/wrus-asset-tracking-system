import { fetchConsumables,addConsumable,updateConsumable } from "./consumable-data.js";

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
    <button class="btn btn-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#placeholderModal">Action</button>
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



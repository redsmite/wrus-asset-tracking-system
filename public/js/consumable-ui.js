document.addEventListener("DOMContentLoaded", () => {
  const addItemForm = document.getElementById("addItemForm");
  const showAddFormBtn = document.getElementById("showAddFormBtn");
  const addItemBtn = document.getElementById("addItemBtn");

  showAddFormBtn.addEventListener("click", () => {
    addItemForm.classList.toggle("d-none");
  });

  addItemBtn.addEventListener("click", () => {
    const spec = document.getElementById("newSpec").value.trim();
    const qty = document.getElementById("newQty").value.trim();
    const unit = document.getElementById("newUnit").value.trim();

    if (!spec || !qty || !unit) {
      alert("Please fill in all fields.");
      return;
    }

    // Just log it for now
    console.log("New Item:", { spec, qty, unit });

    // Optionally clear fields
    document.getElementById("newSpec").value = "";
    document.getElementById("newQty").value = "";
    document.getElementById("newUnit").value = "";
    addItemForm.classList.add("d-none");
  });

  // Toggle + / - action textbox logic
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("toggle-btn")) {
      const currentRow = e.target.closest("tr");
      const input = currentRow.querySelector(".action-input");

      document.querySelectorAll(".action-input").forEach(i => {
        if (i !== input) i.classList.add("d-none");
      });

      input.classList.toggle("d-none");
      if (!input.classList.contains("d-none")) {
        input.focus();
      }
    }
  });
});

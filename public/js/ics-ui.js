import { getUsers } from './ics-data.js';

//logout function
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  });
}

const logoutBtnMobile = document.getElementById("logoutBtnMobile");
if (logoutBtnMobile) {
  logoutBtnMobile.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userFullName");
    window.location.href = "index.html";
  });
}

document.getElementById('addBtn').addEventListener('click', () => {
  const modal = new bootstrap.Modal(document.getElementById('addICSModal'));
  modal.show();
  loadUsers();
});

function loadUsers() {
  const assignedToSelect = document.getElementById('assignedTo');
  assignedToSelect.innerHTML = '<option value="">Select User</option>';

  getUsers().then(users => {
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
      assignedToSelect.appendChild(option);
    });
  });
}

const qtyInput = document.getElementById('qty');
const unitCostInput = document.getElementById('unitCost');
const totalCostDisplay = document.getElementById('totalCostDisplay');

function updateTotalCost() {
  const qty = parseFloat(qtyInput.value) || 0;
  const unitCost = parseFloat(unitCostInput.value) || 0;
  const total = qty * unitCost;
  totalCostDisplay.textContent = `₱${total.toFixed(2)}`;
}

qtyInput.addEventListener('input', updateTotalCost);
unitCostInput.addEventListener('input', updateTotalCost);

// Optional: file size validation
document.getElementById('attachment').addEventListener('change', function () {
  const file = this.files[0];
  if (file && file.size > 1048576) {
    alert("File exceeds 1MB limit.");
    this.value = "";
  }
});

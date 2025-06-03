document.addEventListener("DOMContentLoaded", () => {
  const showFormBtn = document.getElementById("showAddUserFormBtn");
  const addUserForm = document.getElementById("addUserForm");
  const passwordMismatch = document.getElementById("passwordMismatch");

  if (showFormBtn && addUserForm) {
    showFormBtn.addEventListener("click", () => {
      addUserForm.classList.toggle("d-none");
      passwordMismatch?.classList.add("d-none");
    });
  }
});

// user-management-ui.js
document.addEventListener('openEditUserModal', (event) => {
  const userId = event.detail.userId;
  console.log('Edit user ID:', userId);

  // Show Bootstrap modal
  const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
  editUserModal.show();
});

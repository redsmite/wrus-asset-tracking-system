import { db } from "../firebaseConfig.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addUserForm");
  const mismatchError = document.getElementById("passwordMismatch");
  const usersTableBody = document.getElementById("usersTableBody");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const lastName = document.getElementById("newLastName").value.trim();
    const firstName = document.getElementById("newFirstName").value.trim();
    const middleInitial = document.getElementById("newMiddleInitial").value.trim();

    if (password !== confirmPassword) {
      mismatchError.classList.remove("d-none");
      return;
    }

    mismatchError.classList.add("d-none");

    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      const docRef = await addDoc(collection(db, "users"), {
        username,
        password: hashedPassword,
        lastName,
        firstName,
        middleInitial,
        role: "user"
      });

      // Update table dynamically
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${username}</td>
        <td>${lastName}</td>
        <td>${firstName}</td>
        <td>${middleInitial}</td>
        <td>
          <button class="btn btn-sm btn-warning editBtn" data-id="${docRef.id}">Edit</button>
        </td>
      `;
      usersTableBody.appendChild(row);

      alert("User added successfully.");
      form.reset();
      form.classList.add("d-none");
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Failed to add user.");
    }
  });
});

import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { Users } from "../data/cache/user-data.js";
import { NotificationBox } from "../components/notification.js";
import { Spinner } from "../components/spinner.js";

export function initializePasswordChange() {
  const form = document.getElementById("changePasswordForm");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  if (!form || !newPassword || !confirmPassword) {
    console.warn("Password change form or fields not found.");
    return;
  }

  form.onsubmit = async (e) => {
    e.preventDefault();

    Spinner.show();

    try {
      const userId = localStorage.getItem("wrusUserId");
      const pass = newPassword.value.trim();
      const confirm = confirmPassword.value.trim();

      if (!userId) {
        NotificationBox.show("User not found.");
        return;
      }

      if (pass.length < 6) {
        NotificationBox.show("Password must be at least 6 characters.","error");
        return;
      }

      if (pass !== confirm) {
        NotificationBox.show("Passwords do not match.","error");
        return;
      }

      const hashedPassword = await bcrypt.hash(pass, 10);
      await Users.update(userId, { password: hashedPassword });

      NotificationBox.show("Password updated successfully.");
      form.reset();
    } catch (error) {
      console.error("Error changing password:", error);
      NotificationBox.show("An error occurred while updating the password.","error");
    } finally {
      Spinner.hide();
    }
  };
}

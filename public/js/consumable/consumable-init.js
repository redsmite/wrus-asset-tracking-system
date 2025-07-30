import { SessionGuard } from "../auth/auth.js";
import { initializePage } from "./consumable-ui.js";

document.addEventListener("DOMContentLoaded", () => {
  SessionGuard.ensureLoggedIn();
  initializePage();
});
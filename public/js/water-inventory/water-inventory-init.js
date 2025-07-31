import { SessionGuard } from "../auth/auth.js";
import { initializePage } from "./water-inventory-ui.js"

document.addEventListener('DOMContentLoaded',()=>{
  SessionGuard.ensureLoggedIn();
  initializePage();
})
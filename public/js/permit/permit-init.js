import { SessionGuard } from "../auth/auth.js";
import { initializePage } from "./permit-ui.js";

document.addEventListener('DOMContentLoaded',()=>{
  SessionGuard.ensureLoggedIn();
  initializePage();
})
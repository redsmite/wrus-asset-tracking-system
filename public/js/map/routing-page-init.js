import { SessionGuard } from "../auth/auth.js";
import { initializePage } from "./routing-page-ui.js";

document.addEventListener('DOMContentLoaded',()=>{
  SessionGuard.ensureLoggedIn();
  initializePage();
})
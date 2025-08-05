import { SessionGuard } from "../auth/auth.js";
import { initializePage } from "./wrus-ui.js";

document.addEventListener('DOMContentLoaded',()=>{
  SessionGuard.ensureLoggedIn();
  initializePage();
  localStorage.removeItem('cachedWUSDesc');
  localStorage.removeItem('cachedWUSAsc');
})
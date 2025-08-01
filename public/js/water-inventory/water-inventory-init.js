import { SessionGuard } from "../auth/auth.js";
import { initializePage } from "./water-inventory-ui.js"

document.addEventListener('DOMContentLoaded',()=>{
  console.log(localStorage.getItem('waterInventory'));
  SessionGuard.ensureLoggedIn();
  initializePage();
})
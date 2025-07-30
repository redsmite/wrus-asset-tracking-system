import { SessionGuard } from "../auth/auth.js";
import { Sidebar } from "../components/sidebar.js";

document.addEventListener('DOMContentLoaded',()=>{
  SessionGuard.ensureLoggedIn();
  Sidebar.render();
})
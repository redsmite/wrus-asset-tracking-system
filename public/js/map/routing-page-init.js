import { SessionGuard } from "../auth/auth.js";
import { Sidebar } from "../components/sidebar.js";
import { initMap } from "./map-init.js";

document.addEventListener('DOMContentLoaded',()=>{
  SessionGuard.ensureLoggedIn();
  Sidebar.render();
  initMap("leafletMap");
})
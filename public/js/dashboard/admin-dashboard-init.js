import { AdminGuard } from "../auth/auth.js";
import { Sidebar } from "../components/sidebar.js";
import {
  checkAuthentication,
  refreshAllCachesEvery8Hours,
  showEncodedPermitsByUserPerMonth,
  handleEncodedRefreshButton
} from './admin-dashboard-ui.js';

function init() {
  AdminGuard.verify();
  checkAuthentication();
  refreshAllCachesEvery8Hours();
  showEncodedPermitsByUserPerMonth();
  Sidebar.render();
  handleEncodedRefreshButton();
}

document.addEventListener('DOMContentLoaded', init);

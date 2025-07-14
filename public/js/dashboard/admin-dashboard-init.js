import { adminVerification } from '../admin/admin-verification.js';
import { Sidebar } from "../components/sidebar.js";
import {
  checkAuthentication,
  refreshAllCachesEvery8Hours,
  showEncodedPermitsByUserPerMonth,
  handleEncodedRefreshButton
} from './admin-dashboard-ui.js';

function init() {
  adminVerification();
  checkAuthentication();
  refreshAllCachesEvery8Hours();
  showEncodedPermitsByUserPerMonth();
  Sidebar.render();
  handleEncodedRefreshButton();
}

document.addEventListener('DOMContentLoaded', init);

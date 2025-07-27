import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { Users } from '../user/user-data.js';
import { Consumable } from '../consumable/consumable-data.js';
import { Ledger } from "../ledger/ledger-data.js";
import { ICS } from '../ics/ics-data.js';
import { Permit } from "../permit/permit-data.js";
import { WUSData } from "../wrus/wrus-data.js";
import { checkForAppUpdate } from "./version-control.js";

import {
  displayWelcomeText,
  showAnnouncementModal,
  renderEncodedPermitsSummary,
  handleEncodedRefreshButton
} from './dashboard-ui.js';

import { filterPermitsByCity } from "./permit-city-summary.js";
import { initYearlyWaterUserSummary } from "./yearly-summary.js";
import { initCityAccomplishmentSummary } from "./city-accomplishment-summary.js";
import { initializePasswordChange } from "./change-password.js";
import { PortalBubble } from "../components/PortalBubble.js";

document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  refreshAllCachesEvery8Hours();
  Sidebar.render();
  Spinner.render();
  displayWelcomeText();
  showAnnouncementModal("");
  renderEncodedPermitsSummary();
  handleEncodedRefreshButton();
  filterPermitsByCity();
  initYearlyWaterUserSummary();
  initCityAccomplishmentSummary();
  checkForAppUpdate();
  initializePasswordChange();
});

function checkAuthentication() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) window.location.href = "index.html";
}

export async function refreshAllDailyCaches() {
  await Promise.all([
    Users.autoRefreshDaily?.(),
    Consumable.autoRefreshDaily?.(),
    ICS.autoRefreshDaily?.(),
    Permit.autoRefreshDaily?.(),
    WUSData.autoRefreshDaily?.()
  ]);
}


export async function refreshAllCachesEvery8Hours() {
  await Promise.all([
    Users.autoRefreshEvery8Hours?.(),
    Consumable.autoRefreshEvery8Hours?.(),
    ICS.autoRefreshEvery8Hours?.(),
    Permit.autoRefreshEvery8Hours?.(),
    WUSData.autoRefreshEvery8Hours?.(),
    Ledger.autoRefreshEvery8Hours?.()
  ]);
}

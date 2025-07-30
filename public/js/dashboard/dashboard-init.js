import { SessionGuard } from "../auth/auth.js"
import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import { Users } from '../data/cache/user-data.js'
import { Consumable } from '../data/cache/consumable-data.js';
import { Ledger } from "../data/cache/ledger-data.js";
import { ICS } from '../data/cache/ics-data.js';
import { Permit } from "../data/cache/permit-data.js";
import { WUSData } from "../data/cache/wrus-data.js";
import { checkForAppUpdate } from "./version-control.js";
import { filterPermitsByCity } from "./permit-city-summary.js";
import { initYearlyWaterUserSummary } from "./yearly-summary.js";
import { initCityAccomplishmentSummary } from "./city-accomplishment-summary.js";
import { setupMapModal, initMap } from "../map/map-init.js";
import { initMapPrint } from '../map/mapPrint.js';
import { initializePasswordChange } from "./change-password.js";

document.addEventListener('DOMContentLoaded', () => {
  SessionGuard.ensureLoggedIn();
  refreshAllCachesEvery8Hours();
  Sidebar.render();
  Spinner.render();
  filterPermitsByCity();
  initYearlyWaterUserSummary();
  initCityAccomplishmentSummary();
  initMap();
  setupMapModal("mapModal", "leafletMap");
  initMapPrint("printMapBtn", "leafletMap");
  checkForAppUpdate();
  initializePasswordChange();
});

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

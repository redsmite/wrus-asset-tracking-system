import { SessionGuard } from "../auth/auth.js";
import { Sidebar } from "../components/sidebar.js";
import { importExcelPermittees, importExcelNonPermittees} from "./upload-excel.js"

document.addEventListener("DOMContentLoaded", () => {
  SessionGuard.ensureLoggedIn();
  initializePage();
});

function initializePage(){
  Sidebar.render();
  importExcelNonPermittees();
  importExcelPermittees();
}
import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js"
import { initializeFunctions } from "./wrus-ui.js";

document.addEventListener('DOMContentLoaded',()=>{
  Sidebar.render();
  Spinner.render();
  initializeFunctions();
})
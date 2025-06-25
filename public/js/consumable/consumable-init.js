import { Sidebar } from "../components/sidebar.js";
import { Spinner } from "../components/spinner.js";
import {
  initializeEventListeners,
  renderConsumableTable
} from "./consumable-ui.js";

document.addEventListener("DOMContentLoaded", () => {
  Sidebar.render();
  Spinner.render();
  initializeEventListeners();
  renderConsumableTable();
});

import { SessionGuard } from '../auth/auth.js';
import {
  initDOMElements,
  initUI,
  loadData,
  renderTable
} from './summary-ui.js';

document.addEventListener("DOMContentLoaded", async () => {
  SessionGuard.ensureLoggedIn();
  initDOMElements();
  initUI();
  await loadData();
  renderTable();
});
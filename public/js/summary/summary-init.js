import {
  initDOMElements,
  initUI,
  loadData,
  renderTable
} from './summary-ui.js';

document.addEventListener("DOMContentLoaded", async () => {
  initDOMElements();
  initUI();
  await loadData();
  renderTable();
});
import { Sidebar } from '../components/sidebar.js';
import { Spinner } from '../components/spinner.js';
import { adminVerification } from '../admin/admin-verification.js';
import { initializeFunctions } from './user-ui.js';

document.addEventListener('DOMContentLoaded', () => {
  Sidebar.render();
  adminVerification();
  Spinner.render();
  initializeFunctions();
});

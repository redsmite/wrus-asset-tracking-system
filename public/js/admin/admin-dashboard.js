import { renderAdminSidebar } from './admin-sidebar.js';
import { adminVerification } from './admin-verification.js';

document.addEventListener('DOMContentLoaded', () => {
  renderAdminSidebar();
  adminVerification();
});
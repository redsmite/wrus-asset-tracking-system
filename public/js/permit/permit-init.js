import { initializePage } from "./permit-ui.js";

document.addEventListener('DOMContentLoaded',()=>{
  initializePage();
  console.log(localStorage.getItem('cachedPermits'));
})
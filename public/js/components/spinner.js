export const Spinner = {
  containerId: 'spinnerContainer',

  render(containerId = 'spinnerContainer') {
    this.containerId = containerId;
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div id="loadingOverlay">
        <img src="images/denr logo.png" alt="Loading..." class="denr-spin" width="100" height="100" />
      </div>
    `;
  },

  show() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
  },

  hide() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
  }
};

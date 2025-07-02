export const PortalLoader = {
  containerId: 'portalLoaderContainer',

  render(containerId = 'portalLoaderContainer') {
    this.containerId = containerId;
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'portal-loader-overlay';

      container.innerHTML = `
        <div class="portal-loader">
          <div class="ring"></div>
          <div class="ring2"></div>
          <div class="glow"></div>
          <h2>Processing...</h2>
        </div>
      `;

      document.body.appendChild(container);
    }
  },

  show() {
    const overlay = document.getElementById(this.containerId);
    if (overlay) overlay.classList.add('show');
  },

  hide() {
    const overlay = document.getElementById(this.containerId);
    if (overlay) overlay.classList.remove('show');
  }
};
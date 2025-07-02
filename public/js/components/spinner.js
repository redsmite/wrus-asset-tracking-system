export const Spinner = {
  containerId: 'spinnerContainer',

  render(containerId = 'spinnerContainer', rippleCount = 3) {
    this.containerId = containerId;
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }

    // Generate ripple spans dynamically
    const ripples = Array.from({ length: rippleCount })
      .map(() => `<span class="ripple"></span>`)
      .join('');

    container.innerHTML = `
      <div id="loadingOverlay">
        <div class="water-effect">
          ${ripples}
          <img src="images/denr logo.png" alt="Loading..." class="denr-spin" width="100" height="100" />
        </div>
      </div>
    `;

    this.applyRippleDelays(rippleCount);
  },

  applyRippleDelays(rippleCount) {
    const rippleElements = document.querySelectorAll(`#${this.containerId} .ripple`);
    rippleElements.forEach((el, index) => {
      el.style.animationDelay = `${index * 0.8}s`; // Delay each ripple by 0.8s
    });
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

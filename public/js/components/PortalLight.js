export const PortalLight = {
  render() {
    if (!document.getElementById('portal-light')) {
      const div = document.createElement('div');
      div.id = 'portal-light';
      document.body.appendChild(div);
    }
  },

  trigger() {
    const light = document.getElementById('portal-light');
    if (light) {
      light.classList.add('active');

      setTimeout(() => {
        light.classList.remove('active');
      }, 5000); // Matches the CSS animation duration
    }
  }
};

export const PortalFade = {
  render() {
    if (!document.getElementById('portal-fade')) {
      const div = document.createElement('div');
      div.id = 'portal-fade';
      document.body.appendChild(div);
    }
  },

  trigger() {
    if (localStorage.getItem('portalFadeShown') === 'true') return;

    localStorage.setItem('portalFadeShown', 'true');

    const fade = document.getElementById('portal-fade');
    if (fade) {
      fade.classList.add('active');

      setTimeout(() => {
        fade.classList.remove('active');
      }, 5000);
    }
  },

  reset() {
    // Optional: Use this if you want to re-enable the effect manually (for testing/debug)
    localStorage.removeItem('portalFadeShown');
  }
};

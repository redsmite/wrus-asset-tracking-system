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
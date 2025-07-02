export const LoginSuccess = {
  containerId: 'loginSuccessOverlay',

  render(containerId = 'loginSuccessOverlay') {
    this.containerId = containerId;
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'login-success-overlay';

      container.innerHTML = `
        <div class="login-success-content">
          <div class="checkmark">✔</div>
          <p>Login Successful</p>
        </div>
      `;

      document.body.appendChild(container);
    }
  },

  show() {
    const overlay = document.getElementById(this.containerId);
    if (overlay) {
      overlay.classList.add('show');
    }
  },

  hide() {
    const overlay = document.getElementById(this.containerId);
    if (overlay) {
      overlay.classList.remove('show');
    }
  }
};

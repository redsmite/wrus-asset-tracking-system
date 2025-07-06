export const LoginSuccess = {
  render() {
    if (document.getElementById('login-success-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'login-success-overlay';
    overlay.className = 'login-success-overlay';
    overlay.innerHTML = `
      <div class="login-success-content">
        <div class="aqua-container">
          <div class="aqua-wave"></div>
          <div class="gear-icon">
            <i class="fas fa-cog"></i>
          </div>
        </div>
        <p>Login Successful</p>
      </div>
    `;
    document.body.appendChild(overlay);
  },
  show() {
    const overlay = document.getElementById('login-success-overlay');
    if (overlay) overlay.style.display = 'flex';
  },
  hide() {
    const overlay = document.getElementById('login-success-overlay');
    if (overlay) overlay.style.display = 'none';
  }
};

export const NotificationBox = {
  show(message, type = 'success', duration = 3000) {
    // Notification Box
    const notif = document.createElement('div');
    notif.classList.add('notification', type);
    notif.textContent = message;
    document.body.appendChild(notif);

    // 🌧️ Rain Overlay
    const overlay = document.createElement('div');
    overlay.classList.add('rain-overlay');
    document.body.appendChild(overlay);

    // 🌧️ Rain Container
    const rainContainer = document.createElement('div');
    rainContainer.classList.add('rain-container');
    document.body.appendChild(rainContainer);

    // Generate Raindrops
    const dropCount = 100;
    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement('div');
      drop.classList.add('raindrop');

      drop.style.left = `${Math.random() * 100}vw`;
      const delay = Math.random() * 0.5;
      const duration = 0.6 + Math.random() * 0.5;
      const length = 10 + Math.random() * 20;

      drop.style.animationDuration = `${duration}s`;
      drop.style.animationDelay = `${delay}s`;
      drop.style.height = `${length}px`;

      rainContainer.appendChild(drop);
    }

    // Show Notification
    setTimeout(() => notif.classList.add('show'), 10);

    // Remove Rain and Overlay After 1s
    setTimeout(() => {
      rainContainer.classList.add('fade-out');
      overlay.classList.add('fade-out');

      setTimeout(() => {
        rainContainer.remove();
        overlay.remove();
      }, 500);
    }, 1000);

    // Remove Notification After Duration
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 500);
    }, duration);
  }
};

export const Confirmation = {
  show(message, callback) {
    const confirmBox = document.createElement('div');
    confirmBox.classList.add('custom-confirm-overlay');
    confirmBox.innerHTML = `
      <div class="custom-confirm-box">
        <div class="custom-confirm-message">${message}</div>
        <div class="custom-confirm-buttons">
          <button class="btn btn-success btn-sm confirm-yes">Yes</button>
          <button class="btn btn-secondary btn-sm confirm-no">No</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmBox);

    const cleanup = () => {
      confirmBox.remove();
    };

    confirmBox.querySelector('.confirm-yes').addEventListener('click', () => {
      callback(true);
      cleanup();
    });

    confirmBox.querySelector('.confirm-no').addEventListener('click', () => {
      callback(false);
      cleanup();
    });
  }
};



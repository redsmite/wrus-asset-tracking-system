export const NotificationBox = {
  show(message, type = 'success', duration = 3000) {
    const notif = document.createElement('div');
    notif.classList.add('notification', type);
    notif.textContent = message;

    document.body.appendChild(notif);

    // Force CSS transition
    setTimeout(() => notif.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 300);
    }, duration);
  }
};

export const Confirmation = {
  show(message, callback) {
    // Create the container
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

    // Event Listeners
    confirmBox.querySelector('.confirm-yes').addEventListener('click', () => {
      callback(true);
      document.body.removeChild(confirmBox);
    });
    confirmBox.querySelector('.confirm-no').addEventListener('click', () => {
      callback(false);
      document.body.removeChild(confirmBox);
    });
  }
};

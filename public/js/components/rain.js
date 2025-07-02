export const Rain = {
  start() {
    if (document.querySelector('.rain-overlay') || document.querySelector('.rain-container')) {
      // Already running
      return;
    }

    const overlay = document.createElement('div');
    overlay.classList.add('rain-overlay');

    const rainContainer = document.createElement('div');
    rainContainer.classList.add('rain-container');

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

    document.body.appendChild(overlay);
    document.body.appendChild(rainContainer);
  },

  stop() {
    const overlay = document.querySelector('.rain-overlay');
    const rainContainer = document.querySelector('.rain-container');

    if (overlay) overlay.remove();
    if (rainContainer) rainContainer.remove();
  },

  pause() {
    const rainContainer = document.querySelector('.rain-container');
    if (rainContainer) rainContainer.classList.add('paused');
  },

  resume() {
    const rainContainer = document.querySelector('.rain-container');
    if (rainContainer) rainContainer.classList.remove('paused');
  }
};

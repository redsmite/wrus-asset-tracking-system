export const Rain = {
  trigger(dropCount = 100, duration = null) {
    // 🌧️ Rain Overlay
    this.overlay = document.createElement('div');
    this.overlay.classList.add('rain-overlay');
    document.body.appendChild(this.overlay);

    // 🌧️ Rain Container
    this.rainContainer = document.createElement('div');
    this.rainContainer.classList.add('rain-container');
    document.body.appendChild(this.rainContainer);

    // Generate Raindrops
    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement('div');
      drop.classList.add('raindrop');

      drop.style.left = `${Math.random() * 100}vw`;
      const delay = Math.random() * 0.5;
      const dropDuration = 0.6 + Math.random() * 0.5;
      const length = 10 + Math.random() * 20;

      drop.style.animationDuration = `${dropDuration}s`;
      drop.style.animationDelay = `${delay}s`;
      drop.style.height = `${length}px`;

      this.rainContainer.appendChild(drop);
    }

    // ⏳ If duration is provided, auto clear rain after that time
    if (duration) {
      setTimeout(() => {
        this.clear();
      }, duration);
    }
  },

  clear() {
    if (this.rainContainer) this.rainContainer.classList.add('fade-out');
    if (this.overlay) this.overlay.classList.add('fade-out');

    // Remove elements after fade-out
    setTimeout(() => {
      if (this.rainContainer) this.rainContainer.remove();
      if (this.overlay) this.overlay.remove();
      this.rainContainer = null;
      this.overlay = null;
    }, 500);
  }
};
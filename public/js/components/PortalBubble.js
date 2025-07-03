export const PortalBubble = {
  trigger() {
    const bubbleCount = 100;

    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement('div');
      bubble.classList.add('bubble');

      // Random start position across the screen
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      bubble.style.left = `${startX}px`;
      bubble.style.top = `${startY}px`;

      // Random size and opacity
      const size = 10 + Math.random() * 40;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.opacity = Math.random() * 0.6 + 0.3;

      // Generate random drift direction
      const driftX = (Math.random() - 0.5) * 200; // -100 to 100
      const driftY = (Math.random() - 0.5) * 200;

      // Set final position using CSS variables
      bubble.style.setProperty('--drift-x', `${driftX}px`);
      bubble.style.setProperty('--drift-y', `${driftY}px`);

      document.body.appendChild(bubble);

      // Activate after slight delay
      setTimeout(() => bubble.classList.add('active'), Math.random() * 200);

      // Remove after animation
      setTimeout(() => bubble.remove(), 4000);
    }
  }
};

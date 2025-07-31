import { NotificationBox } from "../components/notification.js";
import { Rain } from "../components/Rain.js";

export function setupRainOnLogo(
  selector = ".logo-container",
  dropCount = 100,
  duration = 2800,
  cooldown = 4000
) {
  const container = document.querySelector(selector);
  const logo = container?.querySelector(".denr-logo");

  let isCoolingDown = false; // 🚫 Prevents spam clicks

  // 🎉 List of random greetings (no names mentioned)
  const greetings = [
    "The logo tilts its head curiously. 🐾",
    "The logo wags its… pixels?",
    "The logo perks up its ears at your click.",
    "The logo is happily waiting for the next click.",
    "The logo does a little tail-wag dance.",
    "The logo looks at you like you’re its favorite human.",
    "The logo rolls over in approval. 🐾",
    "The logo happily trots in a circle.",
    "The logo brings you an imaginary stick. 🪵",
    "The logo thinks you deserve a treat. 🍪",
    "The logo nudges you for more attention.",
    "The logo’s tail is wagging out of control!",
    "The logo perks up — did someone say adventure?",
    "The logo drops an imaginary ball at your feet. 🎾",
    "The logo sits patiently, waiting for praise.",
    "The logo is panting happily (in a dignified way).",
    "The logo thinks you’re part of its pack now.",
    "The logo prances with joy.",
    "The logo just did the zoomies across your screen.",
    "The logo flops over, belly up — pure trust. 🐾",
    "The logo leans against your leg like a loyal friend.",
    "The logo is waiting for another click like a game of fetch.",
    "The logo just perked up at the sound of approval.",
    "The logo trots up with invisible muddy paws. 🐾",
    "The logo has that ‘walk time?’ sparkle in its eyes.",
    "The logo is wagging so hard it might fall over.",
    "The logo stares at you with unconditional joy.",
    "The logo thinks you smell like friendship.",
    "The logo hops up like it just saw a squirrel! 🐿️",
    "The logo is loyal, happy, and very proud.",
    "The logo tilts its head, waiting for the next command.",
    "The logo paws at your attention (gently).",
    "The logo gives you the ‘best friend’ look.",
    "The logo brings a leaf as a gift. 🍂",
    "The logo does a happy spin like a puppy.",
    "The logo approves… with a tail wag so big it’s a blur."
  ];

  if (!container || !logo) {
    console.warn(`❗ No element found for selector: ${selector} or .denr-logo inside it`);
    return;
  }

  container.addEventListener("click", async () => {
    if (isCoolingDown) {
      console.log("⚠️ Rain is cooling down, click ignored.");
      return;
    }

    console.log("🌧 Rain triggered + logo spins!");

    // 🌧 Trigger rain
    Rain.trigger(dropCount, duration);

    // 🔄 Add spin class
    logo.classList.add("spin-once");

    // 🧹 When spin animation ends, remove spin class AND show message
    logo.addEventListener(
      "animationend",
      async () => {
        logo.classList.remove("spin-once");

        // 🎯 Pick a random personality greeting
        const randomGreeting =
          greetings[Math.floor(Math.random() * greetings.length)];

        // 📢 Show randomized mascot-style message
        NotificationBox.show(`"${randomGreeting}"`, 'success');
      },
      { once: true }
    );

    // ⏳ Start cooldown
    isCoolingDown = true;
    setTimeout(() => {
      isCoolingDown = false;
    }, cooldown);
  });
}



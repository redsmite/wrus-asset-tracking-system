import { db } from "../firebaseConfig.js";
import {
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { Confirmation } from "../components/notification.js";

// Local version in code
const localVersion = "1.0.3";

// Check for version update
export async function checkForAppUpdate() {
  const versionDoc = doc(db, "config", "version");
  const versionSnap = await getDoc(versionDoc);

  if (versionSnap.exists()) {
    const serverVersion = versionSnap.data().currentVersion;
    if (serverVersion !== localVersion) {
      showUpdatePrompt(serverVersion);
    }
  } else {
    console.warn("No version info found in Firestore.");
  }
}

// Use your custom Confirmation box
function showUpdatePrompt(serverVersion) {
  Confirmation.show(
    `A new version (${serverVersion}) is available. Reload now?`,
    (confirmed) => {
      if (confirmed) {
        location.reload(true); // 🔄 Force refresh
      } else {
        NotificationBox.show("You are using an outdated version.", "warning", 5000);
      }
    }
  );
}
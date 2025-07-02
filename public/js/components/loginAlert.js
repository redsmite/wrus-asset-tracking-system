export const PortalAlert = {
  show(message, title = "Notice") {
    const alert = document.getElementById("portal-alert");
    alert.classList.add("show");
    document.getElementById("portal-alert-message").innerText = message;
    document.getElementById("portal-alert-title").innerText = title;
  },
  close() {
    const alert = document.getElementById("portal-alert");
    alert.classList.remove("show");
  }
};

// ✅ Attach the OK button event after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const okButton = document.getElementById("portal-alert-ok");
  if (okButton) {
    okButton.addEventListener("click", () => {
      PortalAlert.close();
    });
  }
});

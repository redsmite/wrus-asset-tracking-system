export function initMapPrint(buttonId, mapId) {
  const printBtn = document.getElementById(buttonId);

  if (!printBtn) {
    console.error(`Print button with ID '${buttonId}' not found.`);
    return;
  }

  printBtn.addEventListener("click", function () {
    const mapContainer = document.getElementById(mapId);

    if (!mapContainer) {
      console.error(`Map container with ID '${mapId}' not found.`);
      return;
    }

    if (typeof Spinner !== "undefined" && Spinner.show) {
      Spinner.show();
    }

    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
          <style>
            body { margin: 0; }
            #${mapId} {
              width: 100%;
              height: 100vh;
            }
          </style>
        </head>
        <body>
          ${mapContainer.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    const failSafeTimeout = setTimeout(() => {
      if (typeof Spinner !== "undefined" && Spinner.hide) {
        Spinner.hide();
      }
      console.warn("Spinner auto-hidden by failsafe timeout.");
    }, 5000);

    setTimeout(() => {
      printWindow.print();
      printWindow.close();

      if (typeof Spinner !== "undefined" && Spinner.hide) {
        Spinner.hide();
      }

      clearTimeout(failSafeTimeout);
    }, 1500);
  });
}

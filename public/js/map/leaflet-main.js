const map = L.map('map').setView([14.5995, 120.9842], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

L.marker([14.5995, 120.9842]).addTo(map).bindPopup("Manila").openPopup();

function captureMap() {
  html2canvas(document.getElementById('map')).then(canvas => {
    const link = document.createElement('a');
    link.download = 'map.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

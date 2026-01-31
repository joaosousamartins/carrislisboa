const map = L.map('map').setView([38.72, -9.14], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let rotaLayer = null;

async function carregarLinha() {
  const numeroLinha = document.getElementById('linha').value.trim();

  if (!numeroLinha) {
    alert('Digite o número da linha');
    return;
  }

  const routesTxt = await fetch('gtfs/routes.txt').then(r => r.text());
  const tripsTxt  = await fetch('gtfs/trips.txt').then(r => r.text());
  const shapesTxt = await fetch('gtfs/shapes.txt').then(r => r.text());

  // 1️⃣ descobrir route_id pelo número da linha
  const routeLine = routesTxt
    .split('\n')
    .find(l => l.includes(`,${numeroLinha},`));

  if (!routeLine) {
    alert('Linha não encontrada');
    return;
  }

  const routeId = routeLine.split(',')[0];

  // 2️⃣ pegar um trip_id dessa linha
  const tripLine = tripsTxt
    .split('\n')
    .find(l => l.startsWith(routeId + ','));

  if (!tripLine) {
    alert('Trip não encontrada');
    return;
  }

  const tripId = tripLine.split(',')[2];

  // 3️⃣ pegar os pontos do shape
  const pontos = shapesTxt
    .split('\n')
    .filter(l => l.startsWith(tripId))
    .map(l => {
      const c = l.split(',');
      return [parseFloat(c[1]), parseFloat(c[2])];
    });

  if (rotaLayer) map.removeLayer(rotaLayer);

  rotaLayer = L.polyline(pontos, { color: 'red', weight: 4 }).addTo(map);
  map.fitBounds(rotaLayer.getBounds());
}

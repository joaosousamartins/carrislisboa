// Criar mapa
const map = L.map('map').setView([38.72, -9.14], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let rotaAtual = null;

// Função chamada pelo botão
async function carregarLinha() {
  const numeroLinha = document.getElementById('linha').value.trim();

  if (!numeroLinha) {
    alert('Digite o número da linha');
    return;
  }

  // Ler GTFS
  const routesTxt = await fetch('gtfs/routes.txt').then(r => r.text());
  const tripsTxt  = await fetch('gtfs/trips.txt').then(r => r.text());
  const shapesTxt = await fetch('gtfs/shapes.txt').then(r => r.text());

  const routes = routesTxt.split('\n').slice(1);
  const trips  = tripsTxt.split('\n').slice(1);
  const shapes = shapesTxt.split('\n').slice(1);

  // Encontrar route_id pelo número da linha
  const routeLine = routes.find(l => l.split(',')[2] === numeroLinha);

  if (!routeLine) {
    alert('Linha não encontrada');
    return;
  }

  const routeId = routeLine.split(',')[0];

  // Encontrar um trip da linha
  const tripLine = trips.find(l => l.split(',')[0] === routeId);

  if (!tripLine) {
    alert('Trip não encontrada');
    return;
  }

  const shapeId = tripLine.split(',')[2];

  // Buscar pontos do shape
  const pontos = shapes
    .filter(l => l.startsWith(shapeId + ','))
    .map(l => {
      const c = l.split(',');
      return [parseFloat(c[1]), parseFloat(c[2])];
    });

  if (pontos.length === 0) {
    alert('Shape vazio');
    return;
  }

  // Limpar rota anterior
  if (rotaAtual) map.removeLayer(rotaAtual);

  rotaAtual = L.polyline(pontos, {
    color: 'red',
    weight: 4
  }).addTo(map);

  map.fitBounds(rotaAtual.getBounds());
}

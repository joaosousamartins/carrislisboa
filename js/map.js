// ===============================
// MAPA BASE
// ===============================
const map = L.map('map').setView([38.72, -9.14], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let rotaAtual = null;

// ===============================
// FUNÇÃO PRINCIPAL
// ===============================
async function carregarLinha() {
  const numeroLinha = document.getElementById('linha').value.trim();

  if (!numeroLinha) {
    alert('Digite o número da linha');
    return;
  }

  try {
    // ===============================
    // LER ARQUIVOS GTFS
    // ===============================
    const routesTxt = await fetch('gtfs/routes.txt').then(r => r.text());
    const tripsTxt  = await fetch('gtfs/trips.txt').then(r => r.text());
    const shapesTxt = await fetch('gtfs/shapes.txt').then(r => r.text());

    const routes = routesTxt.split('\n').slice(1);
    const trips  = tripsTxt.split('\n').slice(1);
    const shapes = shapesTxt.split('\n').slice(1);

    // ===============================
    // 1️⃣ ROUTE_ID PELO NÚMERO DA LINHA
    // ===============================
    const routeLine = routes.find(l => {
      const c = l.split(';');
      return c[2] === numeroLinha;
    });

    if (!routeLine) {
      alert('Linha não encontrada');
      return;
    }

    const routeId = routeLine.split(';')[0];

    // ===============================
    // 2️⃣ PEGAR UM TRIP DA LINHA
    // ===============================
    const tripLine = trips.find(l => l.split(';')[0] === routeId);

    if (!tripLine) {
      alert('Trip não encontrada');
      return;
    }

    const shapeId = tripLine.split(';')[3];

    if (!shapeId) {
      alert('Shape inexistente');
      return;
    }

    // ===============================
    // 3️⃣ PEGAR PONTOS DO SHAPE
    // ===============================
    const pontos = shapes
      .filter(l => l.startsWith(shapeId + ';'))
      .sort((a, b) => {
        return (
          parseInt(a.split(';')[3]) -
          parseInt(b.split(';')[3])
        );
      })
      .map(l => {
        const c = l.split(';');
        return [
          parseFloat(c[1]), // lat
          parseFloat(c[2])  // lon
        ];
      });

    if (pontos.length === 0) {
      alert('Shape vazio');
      return;
    }

    // ===============================
    // 4️⃣ DESENHAR NO MAPA
    // ===============================
    if (rotaAtual) map.removeLayer(rotaAtual);

    rotaAtual = L.polyline(pontos, {
      color: '#c62828',
      weight: 4
    }).addTo(map);

    map.fitBounds(rotaAtual.getBounds());

  } catch (erro) {
    console.error(erro);
    alert('Erro ao carregar a linha');
  }
}

// Initialize map centered on Lisbon
const map = L.map('map').setView([38.72, -9.14], 12);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store current route layers
let routeLayers = [];

// Parse CSV text into array of objects
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
    });
    return obj;
  });
}

// Main search function
async function carregarLinha() {
  const numeroLinha = document.getElementById('linha').value.trim();
  
  if (!numeroLinha) {
    alert('Digite o número da linha');
    return;
  }
  
  try {
    // Load GTFS files
    const [routesText, tripsText, shapesText] = await Promise.all([
      fetch('gtfs/routes.txt').then(r => r.text()),
      fetch('gtfs/trips.txt').then(r => r.text()),
      fetch('gtfs/shapes.txt').then(r => r.text())
    ]);
    
    // Parse CSV data
    const routes = parseCSV(routesText);
    const trips = parseCSV(tripsText);
    const shapes = parseCSV(shapesText);
    
    // Find route by route_short_name
    const route = routes.find(r => r.route_short_name === numeroLinha);
    
    if (!route) {
      alert(`Linha ${numeroLinha} não encontrada`);
      return;
    }
    
    // Get all trips for this route
    const routeTrips = trips.filter(t => t.route_id === route.route_id);
    
    if (routeTrips.length === 0) {
      alert('Nenhuma viagem encontrada para esta linha');
      return;
    }
    
    // Clear existing routes
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
    
    // Group trips by shape_id to show unique routes
    const uniqueShapes = [...new Set(routeTrips.map(t => t.shape_id))].filter(s => s);
    
    if (uniqueShapes.length === 0) {
      alert('Nenhum percurso encontrado');
      return;
    }
    
    // Draw each unique shape
    const colors = ['#DC2626', '#2563EB', '#16A34A', '#9333EA', '#EA580C'];
    let allBounds = [];
    
    uniqueShapes.forEach((shapeId, index) => {
      // Get all points for this shape
      const shapePoints = shapes
        .filter(s => s.shape_id === shapeId)
        .sort((a, b) => parseInt(a.shape_pt_sequence) - parseInt(b.shape_pt_sequence))
        .map(s => [parseFloat(s.shape_pt_lat), parseFloat(s.shape_pt_lon)]);
      
      if (shapePoints.length > 0) {
        const color = colors[index % colors.length];
        const polyline = L.polyline(shapePoints, {
          color: color,
          weight: 4,
          opacity: 0.7
        }).addTo(map);
        
        routeLayers.push(polyline);
        allBounds = allBounds.concat(shapePoints);
      }
    });
    
    // Fit map to show all routes
    if (allBounds.length > 0) {
      map.fitBounds(allBounds);
    }
    
    console.log(`Linha ${numeroLinha}: ${uniqueShapes.length} percurso(s) encontrado(s)`);
    
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao carregar dados: ' + error.message);
  }
}

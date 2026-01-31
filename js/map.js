// Initialize map
const map = L.map('map').setView([38.72, -9.14], 12);

// Tile layers
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri'
});

// Add default layer
streetLayer.addTo(map);

// State variables
let routeLayers = [];
let allPatterns = [];
let selectedPatternId = null;
let currentLayer = 'street';

// Layer switching
document.addEventListener('DOMContentLoaded', () => {
  const streetBtn = document.getElementById('street-layer-button');
  const satelliteBtn = document.getElementById('satellite-layer-button');
  
  if (streetBtn && satelliteBtn) {
    streetBtn.addEventListener('click', () => {
      if (currentLayer !== 'street') {
        map.removeLayer(satelliteLayer);
        map.addLayer(streetLayer);
        currentLayer = 'street';
        streetBtn.className = 'flex items-center gap-2 p-2 rounded-lg shadow-lg bg-red-600 text-white';
        satelliteBtn.className = 'flex items-center gap-2 p-2 rounded-lg shadow-lg bg-white text-gray-700 hover:bg-gray-100';
      }
    });
    
    satelliteBtn.addEventListener('click', () => {
      if (currentLayer !== 'satellite') {
        map.removeLayer(streetLayer);
        map.addLayer(satelliteLayer);
        currentLayer = 'satellite';
        satelliteBtn.className = 'flex items-center gap-2 p-2 rounded-lg shadow-lg bg-red-600 text-white';
        streetBtn.className = 'flex items-center gap-2 p-2 rounded-lg shadow-lg bg-white text-gray-700 hover:bg-gray-100';
      }
    });
  }
});

// Parse CSV
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

// Generate GPX
function generateGPX(coords, name) {
  let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
  gpx += '<gpx version="1.1" creator="CarrisLisboa" xmlns="http://www.topografix.com/GPX/1/1">\n';
  gpx += `  <trk>\n    <name>${name}</name>\n    <trkseg>\n`;
  
  coords.forEach(coord => {
    gpx += `      <trkpt lat="${coord[0]}" lon="${coord[1]}"></trkpt>\n`;
  });
  
  gpx += '    </trkseg>\n  </trk>\n</gpx>';
  return gpx;
}

// Download GPX
function downloadGPX(coords, filename) {
  const gpxContent = generateGPX(coords, filename);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.gpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Render patterns
function renderPatterns() {
  const container = document.getElementById('patterns-container');
  
  if (!container || allPatterns.length === 0) {
    if (container) container.innerHTML = '';
    return;
  }
  
  container.innerHTML = allPatterns.map(pattern => {
    const isSelected = pattern.shapeId === selectedPatternId;
    const lineName = pattern.routeShortName ? `Linha ${pattern.routeShortName} ${pattern.routeLongName || ''}` : 'Linha';
    const destination = pattern.headsign ? `${pattern.routeShortName} - ${pattern.headsign}` : `${pattern.routeShortName || ''} - Direção ${pattern.directionId === '0' ? '1' : '2'}`;    return `
    const destination = pattern.routeLongName || pattern.headsign || `${pattern.routeShortName || ''} - Direção ${pattern.directionId === '0' ? '1' : '2'}`;    return `        class="pattern-card group rounded-xl border shadow-sm transition-all duration-300 ease-in-out cursor-pointer overflow-hidden $
          isSelected 
            ? 'bg-red-50 border-red-500 shadow-md' 
            : 'bg-white border-gray-200 hover:shadow-lg hover:border-red-400'
        }"
        data-shape-id="${pattern.shapeId}"
      >
        <div class="p-5">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex-grow">
              <p class="text-xs font-semibold text-red-600 uppercase tracking-wider">${lineName} - Destino</p>
              <p class="text-lg font-bold transition-colors ${
                isSelected ? 'text-red-800' : 'text-gray-800 group-hover:text-red-700'
              }">
                ${destination}
              </p>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button 
                class="download-gpx-btn flex-1 sm:flex-none flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onclick="event.stopPropagation(); handleDownloadGPX('${pattern.shapeId}')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download GPX</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click listeners
  container.querySelectorAll('.pattern-card').forEach(card => {
    card.addEventListener('click', () => {
      handlePatternClick(card.dataset.shapeId);
    });
  });
}

// Handle pattern click
function handlePatternClick(shapeId) {
  selectedPatternId = shapeId;
  renderPatterns();
  
  const pattern = allPatterns.find(p => p.shapeId === shapeId);
  if (pattern && pattern.coordinates) {
    drawRoute(pattern.coordinates, '#DC2626');
  }
}

// Handle GPX download
function handleDownloadGPX(shapeId) {
  const pattern = allPatterns.find(p => p.shapeId === shapeId);
  if (pattern && pattern.coordinates) {
    const filename = pattern.headsign || `Linha_${pattern.routeShortName}_${shapeId}`;
    downloadGPX(pattern.coordinates, filename.replace(/[^a-z0-9\-_\.]/gi, '_'));
  }
}

// Draw route
function drawRoute(coordinates, color = '#DC2626') {
  routeLayers.forEach(layer => map.removeLayer(layer));
  routeLayers = [];
  
  const polyline = L.polyline(coordinates, {
    color: color,
    weight: 4,
    opacity: 0.7
  }).addTo(map);
  
  routeLayers.push(polyline);
  map.fitBounds(polyline.getBounds());
}

// Main search
async function carregarLinha() {
  const numeroLinha = document.getElementById('linha').value.trim();
  
  if (!numeroLinha) {
    alert('Digite o número da linha');
    return;
  }
  
  try {
    const [routesText, tripsText, shapesText] = await Promise.all([
      fetch('gtfs/routes.txt').then(r => r.text()),
      fetch('gtfs/trips.txt').then(r => r.text()),
      fetch('gtfs/shapes.txt').then(r => r.text())
    ]);
    
    const routes = parseCSV(routesText);
    const trips = parseCSV(tripsText);
    const shapes = parseCSV(shapesText);
    
    const route = routes.find(r => r.route_short_name === numeroLinha);
    
    if (!route) {
      alert(`Linha ${numeroLinha} não encontrada`);
      allPatterns = [];
      renderPatterns();
      return;
    }
    
    const routeTrips = trips.filter(t => t.route_id === route.route_id);
    
    if (routeTrips.length === 0) {
      alert('Nenhuma viagem encontrada');
      allPatterns = [];
      renderPatterns();
      return;
    }
    
    const uniqueShapes = {};
    routeTrips.forEach(trip => {
      if (trip.shape_id && !uniqueShapes[trip.shape_id]) {
        uniqueShapes[trip.shape_id] = {
          shapeId: trip.shape_id,
          tripHeadsign: trip.trip_headsign,
          directionId: trip.direction_id,
          routeShortName: numeroLinha
        };
      }
    });
    
    allPatterns = Object.values(uniqueShapes).map(shapeInfo => {
      const shapePoints = shapes
        .filter(s => s.shape_id === shapeInfo.shapeId)
        .sort((a, b) => parseInt(a.shape_pt_sequence) - parseInt(b.shape_pt_sequence))
        .map(s => [parseFloat(s.shape_pt_lat), parseFloat(s.shape_pt_lon)]);
      
      return {
        ...shapeInfo,
        headsign: shapeInfo.tripHeadsign,
        coordinates: shapePoints
      };
    }).filter(p => p.coordinates.length > 0);
    
    if (allPatterns.length === 0) {
      alert('Nenhum percurso encontrado');
      return;
    }
    
    selectedPatternId = null;
    renderPatterns();
    
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
    
    const colors = ['#DC2626', '#2563EB', '#16A34A', '#9333EA', '#EA580C'];
    let allBounds = [];
    
    allPatterns.forEach((pattern, index) => {
      const color = colors[index % colors.length];
      const polyline = L.polyline(pattern.coordinates, {
        color: color,
        weight: 4,
        opacity: 0.7
      }).addTo(map);
      
      routeLayers.push(polyline);
      allBounds = allBounds.concat(pattern.coordinates);
    });
    
    if (allBounds.length > 0) {
      map.fitBounds(allBounds);
    }
    
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao carregar dados: ' + error.message);
  }
}

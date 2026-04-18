// ========================================
// DADOS SIMULADOS DAS SALAS (COMPLETOS)
// ========================================

const roomsDatabase = {
  'sala-101': {
    id: 'sala-101',
    name: 'Sala 101',
    badge: 'Ativo',
    temperature: 22.5,
    humidity: 45,
    lightingOn: 30,
    lightingTotal: 42,
    co2: 420,
    status: 'normal',
    statusText: 'Ambiente Normal',
    lastUpdate: 'há 2 minutos',
    location: '1º Andar, Ala Norte',
    capacity: '25 pessoas',
    area: '45 m²',
    hvacSystem: 'Daikin VRV Plus',
    lastMaintenance: '15/03/2026',
    nextMaintenance: '15/06/2026',
    alerts: [
      { type: 'normal', title: 'Temperatura Estável', message: 'A temperatura está dentro dos parâmetros ideais (20-24°C)', time: 'há 5 minutos' },
      { type: 'normal', title: 'Umidade Controlada', message: 'A umidade está dentro dos parâmetros ideais (40-60%)', time: 'há 10 minutos' }
    ]
  },
  'sala-102': {
    id: 'sala-102',
    name: 'Sala 102',
    badge: 'Ativo',
    temperature: 23.1,
    humidity: 42,
    lightingOn: 25,
    lightingTotal: 38,
    co2: 450,
    status: 'normal',
    statusText: 'Ambiente Normal',
    lastUpdate: 'há 1 minuto',
    location: '1º Andar, Ala Norte',
    capacity: '20 pessoas',
    area: '38 m²',
    hvacSystem: 'Carrier AquaEdge',
    lastMaintenance: '10/03/2026',
    nextMaintenance: '10/06/2026',
    alerts: [
      { type: 'normal', title: 'Sistemas Operacionais', message: 'Todos os sistemas funcionando corretamente', time: 'há 3 minutos' }
    ]
  },
  'sala-201': {
    id: 'sala-201',
    name: 'Sala 201',
    badge: 'Ativo',
    temperature: 21.8,
    humidity: 48,
    lightingOn: 18,
    lightingTotal: 28,
    co2: 380,
    status: 'normal',
    statusText: 'Ambiente Normal',
    lastUpdate: 'há 3 minutos',
    location: '2º Andar, Ala Sul',
    capacity: '18 pessoas',
    area: '32 m²',
    hvacSystem: 'Mitsubishi Electric',
    lastMaintenance: '20/03/2026',
    nextMaintenance: '20/06/2026',
    alerts: [
      { type: 'normal', title: 'Qualidade do Ar Excelente', message: 'Níveis de CO₂ em 380 ppm, abaixo do limite recomendado', time: 'há 7 minutos' }
    ]
  },
  'auditorio': {
    id: 'auditorio',
    name: 'Auditório Principal',
    badge: 'Em Uso',
    temperature: 26.5,
    humidity: 38,
    lightingOn: 42,
    lightingTotal: 42,
    co2: 720,
    status: 'alert',
    statusText: 'Temperatura Elevada',
    lastUpdate: 'há 1 minuto',
    location: 'Térreo, Área Central',
    capacity: '150 pessoas',
    area: '180 m²',
    hvacSystem: 'Trane IntelliPak',
    lastMaintenance: '01/04/2026',
    nextMaintenance: '01/07/2026',
    alerts: [
      { type: 'critical', title: 'Temperatura Acima do Ideal', message: 'A temperatura está em 26.5°C, acima do limite recomendado de 24°C', time: 'há 1 minuto' },
      { type: 'warning', title: 'Umidade Baixa', message: 'A umidade está em 38%, abaixo do limite ideal de 40%', time: 'há 5 minutos' },
      { type: 'warning', title: 'Evento em Andamento', message: 'Auditório com capacidade de 80% ocupada', time: 'há 15 minutos' }
    ]
  },
  'laboratorio': {
    id: 'laboratorio',
    name: 'Laboratório A',
    badge: 'Ativo',
    temperature: 20.2,
    humidity: 52,
    lightingOn: 28,
    lightingTotal: 28,
    co2: 550,
    status: 'attention',
    statusText: 'Umidade Elevada',
    lastUpdate: 'há 5 minutos',
    location: '3º Andar, Ala Leste',
    capacity: '30 pessoas',
    area: '65 m²',
    hvacSystem: 'York YK Centrifugal',
    lastMaintenance: '05/04/2026',
    nextMaintenance: '05/07/2026',
    alerts: [
      { type: 'warning', title: 'Umidade Acima do Ideal', message: 'A umidade está em 52%, ligeiramente acima dos 50% recomendados', time: 'há 5 minutos' },
      { type: 'normal', title: 'Iluminação Total Ativada', message: 'Todas as 28 lâmpadas estão acesas conforme protocolo do laboratório', time: 'há 30 minutos' }
    ]
  }
};

// ========================================
// VARIÁVEIS GLOBAIS
// ========================================

let currentRoom = null;

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', function () {
  console.log('🔍 Página de Detalhes da Sala inicializando...');

  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || 'sala-101';
  const scrollTarget = urlParams.get('scroll');

  console.log('📍 ID da sala:', roomId);

  currentRoom = roomsDatabase[roomId];

  if (!currentRoom) {
    console.error('❌ Sala não encontrada:', roomId);
    alert('Sala não encontrada!');
    window.location.href = 'departamento.html';
    return;
  }

  console.log('✅ Dados da sala carregados:', currentRoom);

  updateRoomHeader();
  updateRoomStats();
  updateRoomInfo();
  renderAlerts();
  setupControls();
  renderCharts();

  if (scrollTarget === 'control') {
    setTimeout(() => {
      const controlsSection = document.querySelector('.controls-grid');
      if (controlsSection) {
        controlsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }

  console.log('✅ Página de detalhes carregada com sucesso!');
});

// ========================================
// ATUALIZAR HEADER DA SALA
// ========================================

function updateRoomHeader() {
  const breadcrumbRoom = document.getElementById('breadcrumb-room');
  const roomTitle = document.getElementById('room-title');
  const roomBadge = document.getElementById('room-badge');
  const statusBadge = document.getElementById('room-status-badge');
  const roomStatusText = document.getElementById('room-status-text');
  const lastUpdate = document.getElementById('last-update');

  if (breadcrumbRoom) breadcrumbRoom.textContent = currentRoom.name;
  if (roomTitle) roomTitle.textContent = `📍 ${currentRoom.name}`;
  if (roomBadge) roomBadge.textContent = currentRoom.badge;

  if (statusBadge) {
    statusBadge.className = `room-status-badge status-${currentRoom.status}`;
  }

  if (roomStatusText) roomStatusText.textContent = currentRoom.statusText;
  if (lastUpdate) lastUpdate.textContent = currentRoom.lastUpdate;
}

// ========================================
// ATUALIZAR ESTATÍSTICAS
// ========================================

function updateRoomStats() {
  const statTemp = document.getElementById('stat-temp');
  const statHumidity = document.getElementById('stat-humidity');
  const statLight = document.getElementById('stat-light');
  const statLightPercent = document.getElementById('stat-light-percent');
  const statCo2 = document.getElementById('stat-co2');

  if (statTemp) statTemp.textContent = `${currentRoom.temperature}°C`;
  if (statHumidity) statHumidity.textContent = `${currentRoom.humidity}%`;

  const lightPercentage = Math.round((currentRoom.lightingOn / currentRoom.lightingTotal) * 100);

  if (statLight) statLight.textContent = `${currentRoom.lightingOn}/${currentRoom.lightingTotal}`;
  if (statLightPercent) statLightPercent.textContent = `${lightPercentage}% acesas`;
  if (statCo2) statCo2.textContent = `${currentRoom.co2} ppm`;
}

// ========================================
// ATUALIZAR INFORMAÇÕES DA SALA
// ========================================

function updateRoomInfo() {
  const infoLocation = document.getElementById('info-location');
  const infoCapacity = document.getElementById('info-capacity');
  const infoArea = document.getElementById('info-area');
  const infoHvac = document.getElementById('info-hvac');
  const infoMaintenance = document.getElementById('info-maintenance');
  const infoNextMaintenance = document.getElementById('info-next-maintenance');

  if (infoLocation) infoLocation.textContent = currentRoom.location;
  if (infoCapacity) infoCapacity.textContent = currentRoom.capacity;
  if (infoArea) infoArea.textContent = currentRoom.area;
  if (infoHvac) infoHvac.textContent = currentRoom.hvacSystem;
  if (infoMaintenance) infoMaintenance.textContent = currentRoom.lastMaintenance;
  if (infoNextMaintenance) infoNextMaintenance.textContent = currentRoom.nextMaintenance;
}

// ========================================
// RENDERIZAR ALERTAS
// ========================================

function renderAlerts() {
  const alertsList = document.getElementById('alerts-list');

  if (!alertsList) return;

  if (!currentRoom.alerts || currentRoom.alerts.length === 0) {
    alertsList.innerHTML = `
      <div class="no-alerts">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <p>Nenhum alerta registrado</p>
      </div>
    `;
    return;
  }

  alertsList.innerHTML = '';

  currentRoom.alerts.forEach(alert => {
    const alertItem = document.createElement('div');
    alertItem.className = `alert-item alert-${alert.type}`;

    alertItem.innerHTML = `
      <div class="alert-icon">
        ${getAlertIcon(alert.type)}
      </div>
      <div class="alert-content">
        <h4 class="alert-title">${alert.title}</h4>
        <p class="alert-message">${alert.message}</p>
        <span class="alert-time">${alert.time}</span>
      </div>
    `;

    alertsList.appendChild(alertItem);
  });
}

function getAlertIcon(type) {
  const icons = {
    normal: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `,
    warning: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `,
    critical: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `
  };

  return icons[type] || icons.normal;
}

// ========================================
// CONFIGURAR CONTROLES
// ========================================

function setupControls() {
  const tempSlider = document.getElementById('target-temp-slider');
  const tempValue = document.getElementById('target-temp-value');

  if (tempSlider && tempValue) {
    tempValue.textContent = `${tempSlider.value}°C`;
    tempSlider.addEventListener('input', function () {
      tempValue.textContent = `${this.value}°C`;
    });
  }

  const lightSlider = document.getElementById('light-intensity-slider');
  const lightValue = document.getElementById('light-intensity-value');

  if (lightSlider && lightValue) {
    lightValue.textContent = `${lightSlider.value}%`;
    lightSlider.addEventListener('input', function () {
      lightValue.textContent = `${this.value}%`;
    });
  }

  const ventSlider = document.getElementById('vent-speed-slider');
  const ventValue = document.getElementById('vent-speed-value');
  const speedLabels = ['', 'Baixa', 'Média', 'Alta'];

  if (ventSlider && ventValue) {
    ventValue.textContent = speedLabels[ventSlider.value];
    ventSlider.addEventListener('input', function () {
      ventValue.textContent = speedLabels[this.value];
    });
  }

  const toggleClimate = document.getElementById('toggle-climate');
  const toggleLights = document.getElementById('toggle-lights');
  const toggleVentilation = document.getElementById('toggle-ventilation');
  const climateMode = document.getElementById('climate-mode');

  if (toggleClimate) {
    toggleClimate.addEventListener('change', function () {
      console.log('🌡️ Climatização:', this.checked ? 'Ligada' : 'Desligada');
    });
  }

  if (toggleLights) {
    toggleLights.addEventListener('change', function () {
      console.log('💡 Iluminação:', this.checked ? 'Ligada' : 'Desligada');
    });
  }

  if (toggleVentilation) {
    toggleVentilation.addEventListener('change', function () {
      console.log('🌀 Ventilação:', this.checked ? 'Ligada' : 'Desligada');
    });
  }

  if (climateMode) {
    climateMode.addEventListener('change', function () {
      console.log('🎛️ Modo de climatização alterado para:', this.value);
    });
  }
}

// ========================================
// RENDERIZAR GRÁFICOS
// ========================================

function renderCharts() {
  renderTemperatureChart();
  renderHumidityChart();
}

function renderTemperatureChart() {
  const canvas = document.getElementById('temp-chart-canvas');
  const currentValue = document.getElementById('chart-temp-current');

  if (!canvas || !currentValue) return;

  const tempHistory = generateHistoryData(currentRoom.temperature, 24, 18, 27, 0.5);
  currentValue.textContent = `${currentRoom.temperature}°C`;

  createLineChart(canvas, tempHistory, '#f97316', 18, 28);
}

function renderHumidityChart() {
  const canvas = document.getElementById('humidity-chart-canvas');
  const currentValue = document.getElementById('chart-humidity-current');

  if (!canvas || !currentValue) return;

  const humidityHistory = generateHistoryData(currentRoom.humidity, 24, 30, 70, 1);
  currentValue.textContent = `${currentRoom.humidity}%`;

  createLineChart(canvas, humidityHistory, '#3b82f6', 30, 70);
}

// ========================================
// GERAR DADOS DE HISTÓRICO
// ========================================

function generateHistoryData(currentValue, points, min, max, variance) {
  const data = [];

  for (let i = 0; i < points; i++) {
    const random = (Math.random() - 0.5) * variance * 2;
    let value = currentValue + random;

    value = Math.max(min, Math.min(max, value));
    value = Math.round(value * 10) / 10;

    data.push(value);
  }

  data[data.length - 1] = currentValue;
  return data;
}

// ========================================
// CRIAR GRÁFICO DE LINHA SIMPLES
// ========================================

function createLineChart(container, data, color, minValue, maxValue) {
  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 800 250');
  svg.setAttribute('preserveAspectRatio', 'none');

  const idealMin = minValue + (maxValue - minValue) * 0.25;
  const idealMax = minValue + (maxValue - minValue) * 0.75;

  const idealMinY = 250 - ((idealMin - minValue) / (maxValue - minValue) * 250);
  const idealMaxY = 250 - ((idealMax - minValue) / (maxValue - minValue) * 250);

  const idealZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  idealZone.setAttribute('x', '0');
  idealZone.setAttribute('y', idealMaxY);
  idealZone.setAttribute('width', '800');
  idealZone.setAttribute('height', idealMinY - idealMaxY);
  idealZone.setAttribute('fill', color);
  idealZone.setAttribute('opacity', '0.1');
  svg.appendChild(idealZone);

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 800;
    const y = 250 - ((value - minValue) / (maxValue - minValue) * 250);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,250 ${points} 800,250`;
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  area.setAttribute('points', areaPoints);
  area.setAttribute('fill', color);
  area.setAttribute('opacity', '0.2');
  svg.appendChild(area);

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', points);
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', color);
  polyline.setAttribute('stroke-width', '3');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(polyline);

  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * 800;
    const y = 250 - ((value - minValue) / (maxValue - minValue) * 250);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', color);
    circle.setAttribute('opacity', index === data.length - 1 ? '1' : '0.5');

    svg.appendChild(circle);
  });

  container.appendChild(svg);
}
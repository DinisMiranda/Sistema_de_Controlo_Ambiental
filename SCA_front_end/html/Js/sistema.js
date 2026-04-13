const modulesData = [
  {
    name: 'Temperatura',
    description: 'Monitorização e controlo da climatização ambiente.',
    status: 'operational',
    statusLabel: 'Operacional',
    enabled: true
  },
  {
    name: 'Humidade',
    description: 'Leitura e regulação dos níveis de humidade.',
    status: 'operational',
    statusLabel: 'Operacional',
    enabled: true
  },
  {
    name: 'Iluminação',
    description: 'Gestão da intensidade e zonas de iluminação.',
    status: 'operational',
    statusLabel: 'Operacional',
    enabled: true
  },
  {
    name: 'Ventilação',
    description: 'Controlo do fluxo de ar e renovação do ambiente.',
    status: 'maintenance',
    statusLabel: 'Manutenção',
    enabled: true
  },
  {
    name: 'Qualidade do ar',
    description: 'Avaliação de CO₂ e indicadores ambientais internos.',
    status: 'operational',
    statusLabel: 'Operacional',
    enabled: true
  }
];

const healthData = [
  {
    name: 'API REST',
    status: 'online',
    statusLabel: 'Online',
    description: 'Responde dentro dos parâmetros esperados.'
  },
  {
    name: 'Base de dados',
    status: 'online',
    statusLabel: 'Online',
    description: 'Ligação ativa e sem falhas recentes.'
  },
  {
    name: 'Broker IoT',
    status: 'warning',
    statusLabel: 'Atenção',
    description: 'Latência ligeiramente acima do normal.'
  },
  {
    name: 'Sincronização de dispositivos',
    status: 'online',
    statusLabel: 'Online',
    description: 'Última sincronização concluída com sucesso.'
  }
];

const eventsData = [
  {
    title: 'Parâmetros de temperatura atualizados',
    description: 'O intervalo ideal foi ajustado para 20°C - 24°C.',
    time: 'há 5 minutos'
  },
  {
    title: 'Diagnóstico automático executado',
    description: 'Todos os serviços principais responderam corretamente.',
    time: 'há 18 minutos'
  },
  {
    title: 'Módulo de ventilação em manutenção',
    description: 'Foi sinalizada revisão preventiva do sistema.',
    time: 'há 1 hora'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  renderModules();
  renderHealth();
  renderEvents();
  setupRanges();
  setupActions();
  updateHeaderMeta();
});

function renderModules() {
  const container = document.getElementById('modules-list');
  if (!container) return;

  container.innerHTML = '';

  modulesData.forEach((module, index) => {
    const item = document.createElement('div');
    item.className = 'module-card';

    item.innerHTML = `
      <div class="module-main">
        <span class="module-name">${module.name}</span>
        <span class="module-description">${module.description}</span>
      </div>

      <div class="module-side">
        <span class="module-status ${module.status}">${module.statusLabel}</span>
        <label class="switch">
          <input type="checkbox" ${module.enabled ? 'checked' : ''} data-module-index="${index}">
          <span class="slider"></span>
        </label>
      </div>
    `;

    container.appendChild(item);
  });

  container.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const index = Number(e.target.dataset.moduleIndex);
      modulesData[index].enabled = e.target.checked;
      console.log(`Módulo ${modulesData[index].name}: ${e.target.checked ? 'ativo' : 'inativo'}`);
    });
  });
}

function renderHealth() {
  const container = document.getElementById('health-list');
  if (!container) return;

  container.innerHTML = '';

  healthData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'health-item';

    card.innerHTML = `
      <div class="health-item-top">
        <span class="health-name">${item.name}</span>
        <span class="health-status ${item.status}">${item.statusLabel}</span>
      </div>
      <div class="health-description">${item.description}</div>
    `;

    container.appendChild(card);
  });
}

function renderEvents() {
  const container = document.getElementById('event-list');
  if (!container) return;

  container.innerHTML = '';

  eventsData.forEach(event => {
    const item = document.createElement('div');
    item.className = 'event-item';

    item.innerHTML = `
      <div class="event-item-top">
        <span class="event-title">${event.title}</span>
        <span class="event-time">${event.time}</span>
      </div>
      <div class="event-description">${event.description}</div>
    `;

    container.appendChild(item);
  });
}

function setupRanges() {
  const tempMin = document.getElementById('temp-min');
  const tempMax = document.getElementById('temp-max');
  const humidityMin = document.getElementById('humidity-min');
  const humidityMax = document.getElementById('humidity-max');
  const co2Max = document.getElementById('co2-max');
  const lightDefault = document.getElementById('light-default');

  const temperatureRangeValue = document.getElementById('temperature-range-value');
  const humidityRangeValue = document.getElementById('humidity-range-value');
  const co2MaxValue = document.getElementById('co2-max-value');
  const lightDefaultValue = document.getElementById('light-default-value');

  function updateTemperature() {
    let min = Number(tempMin.value);
    let max = Number(tempMax.value);

    if (min > max) {
      max = min;
      tempMax.value = max;
    }

    temperatureRangeValue.textContent = `${min}°C - ${max}°C`;
  }

  function updateHumidity() {
    let min = Number(humidityMin.value);
    let max = Number(humidityMax.value);

    if (min > max) {
      max = min;
      humidityMax.value = max;
    }

    humidityRangeValue.textContent = `${min}% - ${max}%`;
  }

  function updateCo2() {
    co2MaxValue.textContent = `${co2Max.value} ppm`;
  }

  function updateLight() {
    lightDefaultValue.textContent = `${lightDefault.value}%`;
  }

  if (tempMin && tempMax) {
    tempMin.addEventListener('input', updateTemperature);
    tempMax.addEventListener('input', updateTemperature);
    updateTemperature();
  }

  if (humidityMin && humidityMax) {
    humidityMin.addEventListener('input', updateHumidity);
    humidityMax.addEventListener('input', updateHumidity);
    updateHumidity();
  }

  if (co2Max) {
    co2Max.addEventListener('input', updateCo2);
    updateCo2();
  }

  if (lightDefault) {
    lightDefault.addEventListener('input', updateLight);
    updateLight();
  }
}

function setupActions() {
  const btnSave = document.getElementById('btn-save-system');
  const btnTest = document.getElementById('btn-test-connection');
  const btnSyncNow = document.getElementById('btn-sync-now');
  const btnDiagnostics = document.getElementById('btn-run-diagnostics');
  const btnMaintenanceLog = document.getElementById('btn-maintenance-log');

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      alert('Alterações guardadas com sucesso.');
    });
  }

  if (btnTest) {
    btnTest.addEventListener('click', () => {
      alert('Ligação testada com sucesso.');
    });
  }

  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', () => {
      alert('Sincronização iniciada.');
    });
  }

  if (btnDiagnostics) {
    btnDiagnostics.addEventListener('click', () => {
      alert('Diagnóstico executado.');
    });
  }

  if (btnMaintenanceLog) {
    btnMaintenanceLog.addEventListener('click', () => {
      alert('A abrir registo técnico.');
    });
  }
}

function updateHeaderMeta() {
  const metaLastSync = document.getElementById('meta-last-sync');
  if (metaLastSync) {
    metaLastSync.textContent = new Date().toLocaleString('pt-PT');
  }
}
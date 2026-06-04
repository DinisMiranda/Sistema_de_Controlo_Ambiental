let modulesData = [];
let healthData = [];
let eventsData = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user) return;

  setupShell("sistema");
  startTimestampClock();
  setupRanges();
  setupActions();
  updateHeaderMeta();
  await loadSystemData();
});

async function loadSystemData() {
  const apiBase = window.CONFIG?.API_BASE || "http://localhost:3001";

  try {
    const [tiposRes, sensoresRes, atuadoresRes, healthRes] = await Promise.all([
      fetchWithAuth("/api/tipos"),
      fetchWithAuth("/api/sensores"),
      fetchWithAuth("/api/atuadores"),
      fetch(`${apiBase}/health/db`),
    ]);

    if (tiposRes.ok) {
      const tipos = await tiposRes.json();
      modulesData = tipos.map((tipo) => ({
        name: tipo.tipo || tipo.Tipos_tipo || tipo.nome || "Tipo",
        description: `Classe: ${tipo.classe || tipo.Tipos_classe || "—"}`,
        status: "operational",
        statusLabel: "Operacional",
        enabled: true,
      }));
    }

    const sensorCount = sensoresRes.ok
      ? (await sensoresRes.json()).length
      : 0;
    const atuadorCount = atuadoresRes.ok
      ? (await atuadoresRes.json()).length
      : 0;
    const dbOnline = healthRes.ok;

    healthData = [
      {
        name: "API REST",
        status: "online",
        statusLabel: "Online",
        description: "Backend a responder.",
      },
      {
        name: "Base de dados",
        status: dbOnline ? "online" : "warning",
        statusLabel: dbOnline ? "Online" : "Atenção",
        description: dbOnline
          ? "Ligação MySQL ativa."
          : "Não foi possível validar a ligação.",
      },
      {
        name: "Sensores",
        status: sensorCount > 0 ? "online" : "warning",
        statusLabel: sensorCount > 0 ? "Online" : "Sem dados",
        description: `${sensorCount} sensor(es) registado(s).`,
      },
      {
        name: "Atuadores",
        status: atuadorCount > 0 ? "online" : "warning",
        statusLabel: atuadorCount > 0 ? "Online" : "Sem dados",
        description: `${atuadorCount} atuador(es) registado(s).`,
      },
    ];

    eventsData = [
      {
        title: "Dados carregados da API",
        description: `Sincronização com ${sensorCount} sensores e ${atuadorCount} atuadores.`,
        time: new Date().toLocaleString("pt-PT"),
      },
    ];
  } catch (error) {
    console.error("Erro ao carregar sistema:", error);
    modulesData = [];
    healthData = [
      {
        name: "API REST",
        status: "warning",
        statusLabel: "Indisponível",
        description: "Não foi possível contactar o backend.",
      },
    ];
    eventsData = [];
  }

  renderModules();
  renderHealth();
  renderEvents();
}

function renderModules() {
  const container = document.getElementById("modules-list");
  if (!container) return;

  container.innerHTML = "";

  modulesData.forEach((module, index) => {
    const item = document.createElement("div");
    item.className = "module-card";

    item.innerHTML = `
      <div class="module-main">
        <span class="module-name">${module.name}</span>
        <span class="module-description">${module.description}</span>
      </div>

      <div class="module-side">
        <span class="module-status ${module.status}">${module.statusLabel}</span>
        <label class="switch">
          <input type="checkbox" ${module.enabled ? "checked" : ""} data-module-index="${index}">
          <span class="slider"></span>
        </label>
      </div>
    `;

    container.appendChild(item);
  });

  container.querySelectorAll('input[type="checkbox"]').forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const index = Number(e.target.dataset.moduleIndex);
      modulesData[index].enabled = e.target.checked;
      console.log(
        `Módulo ${modulesData[index].name}: ${e.target.checked ? "ativo" : "inativo"}`,
      );
    });
  });
}

function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userInfoElement = document.getElementById("user-info");

  if (user && userInfoElement) {
    userInfoElement.textContent = `👤 ${user.name}`;
  }
}

function renderHealth() {
  const container = document.getElementById("health-list");
  if (!container) return;

  container.innerHTML = "";

  healthData.forEach((item) => {
    const card = document.createElement("div");
    card.className = "health-item";

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
  const container = document.getElementById("event-list");
  if (!container) return;

  container.innerHTML = "";

  eventsData.forEach((event) => {
    const item = document.createElement("div");
    item.className = "event-item";

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
  const tempMin = document.getElementById("temp-min");
  const tempMax = document.getElementById("temp-max");
  const humidityMin = document.getElementById("humidity-min");
  const humidityMax = document.getElementById("humidity-max");
  const co2Max = document.getElementById("co2-max");
  const lightDefault = document.getElementById("light-default");

  const temperatureRangeValue = document.getElementById(
    "temperature-range-value",
  );
  const humidityRangeValue = document.getElementById("humidity-range-value");
  const co2MaxValue = document.getElementById("co2-max-value");
  const lightDefaultValue = document.getElementById("light-default-value");

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
    tempMin.addEventListener("input", updateTemperature);
    tempMax.addEventListener("input", updateTemperature);
    updateTemperature();
  }

  if (humidityMin && humidityMax) {
    humidityMin.addEventListener("input", updateHumidity);
    humidityMax.addEventListener("input", updateHumidity);
    updateHumidity();
  }

  if (co2Max) {
    co2Max.addEventListener("input", updateCo2);
    updateCo2();
  }

  if (lightDefault) {
    lightDefault.addEventListener("input", updateLight);
    updateLight();
  }
}

function setupActions() {
  const btnSave = document.getElementById("btn-save-system");
  const btnTest = document.getElementById("btn-test-connection");
  const btnSyncNow = document.getElementById("btn-sync-now");
  const btnDiagnostics = document.getElementById("btn-run-diagnostics");
  const btnMaintenanceLog = document.getElementById("btn-maintenance-log");

  if (btnSave) {
    btnSave.addEventListener("click", () => {
      alert("Alterações guardadas com sucesso.");
    });
  }

  if (btnTest) {
    btnTest.addEventListener("click", async () => {
      const apiBase = window.CONFIG?.API_BASE || "http://localhost:3001";
      try {
        const res = await fetch(`${apiBase}/health/db`);
        alert(res.ok ? "Ligação OK (API + BD)." : "API respondeu mas a BD falhou.");
      } catch {
        alert("Não foi possível contactar o backend.");
      }
    });
  }

  if (btnSyncNow) {
    btnSyncNow.addEventListener("click", async () => {
      await loadSystemData();
      updateHeaderMeta();
      alert("Dados atualizados a partir da API.");
    });
  }

  if (btnDiagnostics) {
    btnDiagnostics.addEventListener("click", async () => {
      await loadSystemData();
      alert("Diagnóstico concluído. Ver estado técnico na página.");
    });
  }

  if (btnMaintenanceLog) {
    btnMaintenanceLog.addEventListener("click", () => {
      alert("A abrir registo técnico.");
    });
  }
}

function updateHeaderMeta() {
  const metaLastSync = document.getElementById("meta-last-sync");
  if (metaLastSync) {
    metaLastSync.textContent = new Date().toLocaleString("pt-PT");
  }
}

// ========================================
// LOGOUT
// ========================================

function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
}

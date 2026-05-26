let departmentsData = [];

function formatRoomKey(location) {
  return String(location)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function fetchSensorRooms() {
  try {
    const response = await fetchWithAuth("/api/sensores");
    if (!response.ok) {
      console.error("Não foi possível carregar os sensores do backend.");
      return {};
    }

    const sensors = await response.json();
    const rooms = {};

    sensors.forEach((sensor) => {
      const location = sensor.localizacao || "Desconhecido";
      const roomKey = formatRoomKey(location);
      if (!rooms[roomKey]) {
        rooms[roomKey] = {
          id: roomKey,
          name: location,
          sensors: [],
        };
      }
      rooms[roomKey].sensors.push(sensor);
    });

    return rooms;
  } catch (error) {
    console.error("Erro ao buscar dados de sensores:", error);
    return {};
  }
}

function getSensorByType(room, typeRegExp) {
  if (!room || !Array.isArray(room.sensors)) return null;
  return room.sensors.find((sensor) => typeRegExp.test(sensor.tipo_sensor));
}

async function fetchLatestReading(sensorId) {
  if (!sensorId) return null;
  try {
    const response = await fetchWithAuth(`/api/sensores/${sensorId}/latest`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Erro ao carregar leituras do sensor:", error);
    return null;
  }
}

function parseReadingValue(reading) {
  if (!reading || reading.valor === undefined || reading.valor === null)
    return null;
  const value = Number(reading.valor);
  return Number.isFinite(value) ? value : reading.valor;
}

function getRoomStatus(temperature, humidity, co2) {
  if (
    (typeof temperature === "number" &&
      (temperature < 18 || temperature > 26)) ||
    (typeof humidity === "number" && (humidity < 35 || humidity > 65)) ||
    (typeof co2 === "number" && co2 > 1000)
  ) {
    return "alert";
  }

  if (
    (typeof temperature === "number" &&
      (temperature < 20 || temperature > 24)) ||
    (typeof humidity === "number" && (humidity < 40 || humidity > 60)) ||
    (typeof co2 === "number" && co2 > 800)
  ) {
    return "attention";
  }

  return "normal";
}

function getRoomStatusText(status) {
  if (status === "alert") return "Alerta — ação necessária";
  if (status === "attention") return "Atenção — monitorar";
  return "Ambiente Normal";
}

function getAirQualityLabel(co2) {
  if (typeof co2 !== "number") return "Desconhecida";
  if (co2 <= 800) return "Boa";
  if (co2 <= 1000) return "Moderada";
  return "Elevada";
}

function sensorIdOf(sensor) {
  return sensor?.id_sensor ?? sensor?.id;
}

function formatLastUpdate(timestamp) {
  if (!timestamp) return "há instantes";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "há instantes";
  return date.toLocaleString("pt-PT");
}

function applyReadingToRoom(room, sensor, latest) {
  const type = String(sensor.tipo_sensor || sensor.Tipos_tipo || "");
  const value = parseReadingValue(latest);

  if (/temperatura/i.test(type)) {
    room.temperature = value;
  } else if (/humidade|umidade/i.test(type)) {
    room.humidity = value;
  } else if (/luminosidade|iluminacao|iluminação/i.test(type)) {
    const light = typeof value === "number" ? Math.round(value) : 0;
    room.lightingOn = light;
    room.lightingTotal = 100;
  }

  if (latest?.timestamp_leitura) {
    room.lastUpdate = formatLastUpdate(latest.timestamp_leitura);
  }
}

async function hydrateRoomMetrics(room) {
  if (!room.sensors?.length) {
    room.badge = room.badge || "Sem sensores";
    room.status = "attention";
    room.statusText = getRoomStatusText("attention");
    room.lastUpdate = "—";
    return;
  }

  room.badge = room.badge || "Ativo";
  room.lightingTotal = room.lightingTotal || 100;
  room.lightingOn = room.lightingOn ?? 0;

  await Promise.all(
    room.sensors.map(async (sensor) => {
      const sensorId = sensorIdOf(sensor);
      if (!sensorId) return;

      try {
        const response = await fetchWithAuth(
          `/api/sensores/${sensorId}/latest`,
        );
        if (!response.ok) return;
        const latest = await response.json();
        applyReadingToRoom(room, sensor, latest);
      } catch (err) {
        console.error(`Erro ao carregar sensor ${sensorId}:`, err);
      }
    }),
  );

  room.status = getRoomStatus(room.temperature, room.humidity, null);
  room.statusText = getRoomStatusText(room.status);
  if (!room.lastUpdate) {
    room.lastUpdate = "há instantes";
  }
}

async function initializeDepartments() {
  try {
    const roomResponse = await fetchWithAuth("/api/salas");
    const roomsData = await roomResponse.json();

    const sensorResponse = await fetchWithAuth("/api/sensores");
    const sensors = await sensorResponse.json();

    const rooms = {};

    roomsData.forEach((room) => {
      rooms[room.id] = {
        ...room,
        name: room.name || room.location,
        sensors: [],
        badge: room.badge || "Ativo",
      };
    });

    sensors.forEach((sensor) => {
      const roomKey =
        sensor.roomId || formatRoomKey(sensor.localizacao || "");
      if (rooms[roomKey]) {
        rooms[roomKey].sensors.push(sensor);
      }
    });

    departmentsData = Object.values(rooms);

    await Promise.all(departmentsData.map((room) => hydrateRoomMetrics(room)));

    renderDepartmentCards();
    updateStatistics();

    console.log("Departments initialized successfully");
  } catch (error) {
    console.error("Error initializing departments:", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const user = await requireAuth();
  if (!user) return;

  console.log("🏢 Página de Departamentos inicializando...");

  // checkAdminAccess();
  setupLogout();
  await initializeDepartments();
  setupFilters();
  loadUserInfo();

  console.log("✅ Departamentos carregados com sucesso!");
});

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const adminLink = document.querySelector(".admin-link");

  if (!adminLink) return;

  const isAdmin = user && String(user.role || "").toLowerCase() === "admin";

  if (!isAdmin) {
    adminLink.style.display = "none";
  }
});

function renderDepartmentCards(filter = "all") {
  const grid = document.getElementById("departments-grid");
  const noResults = document.getElementById("no-results");

  if (!grid) {
    console.error("❌ Grid de departamentos não encontrado");
    return;
  }

  grid.innerHTML = "";

  let cardsRendered = 0;

  Object.values(departmentsData).forEach((room) => {
    if (!shouldShowRoom(room, filter)) {
      return;
    }

    const card = createDepartmentCard(room);
    grid.appendChild(card);
    cardsRendered++;
  });

  if (cardsRendered === 0) {
    if (noResults) noResults.style.display = "flex";
    grid.style.display = "none";
  } else {
    if (noResults) noResults.style.display = "none";
    grid.style.display = "grid";
  }

  console.log(`📊 ${cardsRendered} cards renderizados (filtro: ${filter})`);
}

function shouldShowRoom(room, filter) {
  if (filter === "all") return true;

  if (typeof room.temperature === "number") {
    if (filter === "temperature") {
      return room.temperature < 20 || room.temperature > 24;
    }
  }

  if (typeof room.humidity === "number") {
    if (filter === "humidity") {
      return room.humidity < 40 || room.humidity > 60;
    }
  }

  if (filter === "light") {
    return true;
  }

  return true;
}

function formatMetric(value, unit) {
  return typeof value === "number" ? `${value}${unit}` : "N/A";
}

function createDepartmentCard(room) {
  const card = document.createElement("div");
  const status = room.status || "normal";
  card.className = `department-card status-${status}`;
  card.setAttribute("data-room-id", room.id);
  card.setAttribute("data-temperature", room.temperature ?? "");
  card.setAttribute("data-humidity", room.humidity ?? "");

  const lightOn = Number(room.lightingOn) || 0;
  const lightTotal = Number(room.lightingTotal) || 100;
  const lightPercentage =
    lightTotal > 0 ? Math.round((lightOn / lightTotal) * 100) : 0;
  const tempClass = getTempAlertClass(
    typeof room.temperature === "number" ? room.temperature : NaN,
  );
  const humidityClass = getHumidityAlertClass(
    typeof room.humidity === "number" ? room.humidity : NaN,
  );

  card.innerHTML = `
    <div class="card-header-dept">
      <h3 class="room-name">📍 ${room.name}</h3>
      <span class="room-badge">${room.badge || "Ativo"}</span>
    </div>

    <div class="card-metrics">
      <div class="metric-row">
        <div class="metric-info">
          <svg class="metric-icon-small temp-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
          </svg>
          <span class="metric-name">Temperatura</span>
        </div>
        <span class="metric-data ${tempClass}">${formatMetric(room.temperature, "°C")}</span>
      </div>

      <div class="metric-row">
        <div class="metric-info">
          <svg class="metric-icon-small humidity-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
          <span class="metric-name">Humidade</span>
        </div>
        <span class="metric-data ${humidityClass}">${formatMetric(room.humidity, "%")}</span>
      </div>

      <div class="metric-row">
        <div class="metric-info">
          <svg class="metric-icon-small light-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <span class="metric-name">Iluminação</span>
        </div>
        <span class="metric-data">${
          typeof room.lightingOn === "number"
            ? `${lightOn}/${lightTotal} (${lightPercentage}%)`
            : "N/A"
        }</span>
      </div>
    </div>

    <div class="card-status status-${status}">
      ${getStatusIcon(status)}
      <span>${room.statusText || getRoomStatusText(status)}</span>
    </div>

    <div class="card-updated">
      Atualizado ${room.lastUpdate || "há instantes"}
    </div>

    <div class="card-actions">
      <button class="btn-details" data-room-id="${room.id}" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Detalhes
      </button>

      <button class="btn-control" data-room-id="${room.id}" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        Controlar
      </button>
    </div>
  `;

  const btnDetails = card.querySelector(".btn-details");
  const btnControl = card.querySelector(".btn-control");

  btnDetails.addEventListener("click", function () {
    goToRoomDetails(room.id);
  });

  btnControl.addEventListener("click", function () {
    goToRoomControl(room.id);
  });

  return card;
}

function getTempAlertClass(temp) {
  if (typeof temp !== "number") return "";
  if (temp < 18 || temp > 26) return "alert";
  if (temp < 20 || temp > 24) return "warning";
  return "";
}

function getHumidityAlertClass(humidity) {
  if (typeof humidity !== "number") return "";
  if (humidity < 35 || humidity > 65) return "alert";
  if (humidity < 40 || humidity > 60) return "warning";
  return "";
}

function getStatusIcon(status) {
  const icons = {
    normal: `
      <svg class="status-icon-small" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `,
    attention: `
      <svg class="status-icon-small" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `,
    alert: `
      <svg class="status-icon-small" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `,
  };

  return icons[status] || icons.normal;
}

function setupFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");

  if (filterBtns.length === 0) {
    console.warn("⚠️ Botões de filtro não encontrados");
    return;
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter");

      filterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      renderDepartmentCards(filter);

      console.log("🔍 Filtro aplicado:", filter);
    });
  });
}

function updateStatistics() {
  const totalRooms = departmentsData.length;

  let roomsOk = 0;
  let roomsWarning = 0;
  let roomsAlert = 0;

  Object.values(departmentsData).forEach((room) => {
    if (room.status === "normal") roomsOk++;
    else if (room.status === "attention") roomsWarning++;
    else if (room.status === "alert") roomsAlert++;
  });

  const totalEl = document.getElementById("total-rooms");
  const okEl = document.getElementById("rooms-ok");
  const warningEl = document.getElementById("rooms-warning");
  const alertEl = document.getElementById("rooms-alert");

  if (totalEl) totalEl.textContent = totalRooms;
  if (okEl) okEl.textContent = roomsOk;
  if (warningEl) warningEl.textContent = roomsWarning;
  if (alertEl) alertEl.textContent = roomsAlert;
}

function goToRoomDetails(roomId) {
  console.log("📍 Navegando para detalhes da sala:", roomId);
  window.location.href = `detalhe_departamento.html?room=${encodeURIComponent(roomId)}`;
}

function goToRoomControl(roomId) {
  console.log("🎛️ Navegando para controle da sala:", roomId);
  window.location.href = `detalhe_departamento.html?room=${encodeURIComponent(roomId)}&scroll=control`;
}

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
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userInfoElement = document.getElementById("user-info");

  if (user && userInfoElement) {
    const displayName = user.name || user.nome || user.email || "Utilizador";
    userInfoElement.textContent = `👤 ${displayName}`;
  }
}

async function initializePage() {
  const user = await requireAuth();
  if (!user) return;

  console.log("🚀 Inicializando página de departamentos...");
}

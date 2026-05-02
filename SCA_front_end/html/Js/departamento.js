let departmentsData = {};

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
    const response = await fetchWithAuth(`/api/sensors/${sensorId}/readings`);
    if (!response.ok) return null;
    const readings = await response.json();
    return Array.isArray(readings) && readings.length > 0 ? readings[0] : null;
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

async function initializeDepartments() {
  const rooms = await fetchSensorRooms();
  departmentsData = await Promise.all(
    Object.values(rooms).map(async (room) => {
      const temperatureSensor = getSensorByType(room, /temperatura/i);
      const humiditySensor = getSensorByType(room, /humidade/i);
      const lightSensor = getSensorByType(room, /luminosidade/i);
      const co2Sensor = getSensorByType(room, /co2/i);

      const [tempReading, humidityReading, lightReading, co2Reading] =
        await Promise.all([
          fetchLatestReading(temperatureSensor?.id_sensor),
          fetchLatestReading(humiditySensor?.id_sensor),
          fetchLatestReading(lightSensor?.id_sensor),
          fetchLatestReading(co2Sensor?.id_sensor),
        ]);

      const temperature = parseReadingValue(tempReading);
      const humidity = parseReadingValue(humidityReading);
      const lightValue = parseReadingValue(lightReading);
      const co2 = parseReadingValue(co2Reading);

      const lightingOn =
        typeof lightValue === "number" ? Math.round(lightValue / 10) : 0;
      const lightingTotal = room.sensors.length || 1;
      const status = getRoomStatus(temperature, humidity, co2);

      return {
        id: room.id,
        name: room.name,
        badge:
          status === "normal"
            ? "Ativo"
            : status === "attention"
              ? "Atenção"
              : "Alerta",
        temperature:
          typeof temperature === "number" ? temperature.toFixed(1) : "N/A",
        humidity: typeof humidity === "number" ? humidity.toFixed(0) : "N/A",
        lightingOn,
        lightingTotal,
        status,
        statusText: getRoomStatusText(status),
        lastUpdate:
          tempReading?.timestamp_leitura ||
          humidityReading?.timestamp_leitura ||
          lightReading?.timestamp_leitura ||
          co2Reading?.timestamp_leitura ||
          "Desconhecido",
      };
    }),
  );

  renderDepartmentCards();
  updateStatistics();
}

document.addEventListener("DOMContentLoaded", async function () {
  const user = await requireAuth();
  if (!user) return;

  console.log("🏢 Página de Departamentos inicializando...");

  checkAdminAccess();
  setupLogout();
  await initializeDepartments();
  setupFilters();

  console.log("✅ Departamentos carregados com sucesso!");
});

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  const adminLink = document.querySelector(".admin-link");

  if (adminLink) {
    if (user?.role === "Admin") {
      adminLink.style.display = "block";
    } else {
      adminLink.style.display = "none";
    }
  }
}

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

function createDepartmentCard(room) {
  const card = document.createElement("div");
  card.className = `department-card status-${room.status}`;
  card.setAttribute("data-room-id", room.id);
  card.setAttribute("data-temperature", room.temperature);
  card.setAttribute("data-humidity", room.humidity);

  const lightPercentage = Math.round(
    (room.lightingOn / room.lightingTotal) * 100,
  );
  const tempClass = getTempAlertClass(Number(room.temperature));
  const humidityClass = getHumidityAlertClass(Number(room.humidity));

  card.innerHTML = `
    <div class="card-header-dept">
      <h3 class="room-name">📍 ${room.name}</h3>
      <span class="room-badge">${room.badge}</span>
    </div>

    <div class="card-metrics">
      <div class="metric-row">
        <div class="metric-info">
          <svg class="metric-icon-small temp-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
          </svg>
          <span class="metric-name">Temperatura</span>
        </div>
        <span class="metric-data ${tempClass}">${room.temperature}°C</span>
      </div>

      <div class="metric-row">
        <div class="metric-info">
          <svg class="metric-icon-small humidity-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
          <span class="metric-name">Umidade</span>
        </div>
        <span class="metric-data ${humidityClass}">${room.humidity}%</span>
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
        <span class="metric-data">${room.lightingOn}/${room.lightingTotal} (${lightPercentage}%)</span>
      </div>
    </div>

    <div class="card-status status-${room.status}">
      ${getStatusIcon(room.status)}
      <span>${room.statusText}</span>
    </div>

    <div class="card-updated">
      Atualizado ${room.lastUpdate}
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
  const totalRooms = Object.keys(departmentsData).length;

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
    logoutBtn.addEventListener("click", function () {
      clearSession();
      window.location.href = "login.html";
    });
  }
}

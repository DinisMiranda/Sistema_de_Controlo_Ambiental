let currentRoom = null;

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
    const response = await fetchWithAuth(`/api/sensores/${sensorId}/readings`);
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

function determineRoomStatus(temperature, humidity, co2) {
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

function getStatusText(status) {
  if (status === "alert") return "Atenção — revisão necessária";
  if (status === "attention") return "Atenção — monitorar condições";
  return "Ambiente Normal";
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
    `,
  };

  return icons[type] || icons.normal;
}

function generateRoomAlerts({ temperature, humidity, co2, status }) {
  const alerts = [];

  if (
    typeof temperature === "number" &&
    (temperature < 20 || temperature > 24)
  ) {
    alerts.push({
      type: status === "alert" ? "critical" : "warning",
      title: "Temperatura fora do ideal",
      message: `Temperatura atual de ${temperature.toFixed(1)}°C, observe o alvo 20-24°C`,
      time: "há poucos minutos",
    });
  }

  if (typeof humidity === "number" && (humidity < 40 || humidity > 60)) {
    alerts.push({
      type: status === "alert" ? "warning" : "normal",
      title: "Umidade fora do intervalo ideal",
      message: `Umidade atual de ${humidity.toFixed(0)}%, ideal entre 40-60%`,
      time: "há poucos minutos",
    });
  }

  if (typeof co2 === "number" && co2 > 800) {
    alerts.push({
      type: co2 > 1000 ? "critical" : "warning",
      title: "Nível de CO₂ elevado",
      message: `CO₂ atual de ${co2} ppm, verifique ventilação`,
      time: "há poucos minutos",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "normal",
      title: "Condições dentro do esperado",
      message: "Todos os parâmetros encontram-se nos níveis recomendados.",
      time: "há poucos minutos",
    });
  }

  return alerts;
}

async function loadRoomActualData(room) {
  const temperatureSensor = getSensorByType(room, /temperatura|temp/i);
  const humiditySensor = getSensorByType(room, /humidade|humedad/i);
  const lightSensor = getSensorByType(room, /luminosidade|luz|ilumina/i);
  const co2Sensor = getSensorByType(room, /co2|dioxido/i);

  const [temperatureReading, humidityReading, lightReading, co2Reading] =
    await Promise.all([
      fetchLatestReading(temperatureSensor?.id_sensor),
      fetchLatestReading(humiditySensor?.id_sensor),
      fetchLatestReading(lightSensor?.id_sensor),
      fetchLatestReading(co2Sensor?.id_sensor),
    ]);

  const temperature = parseReadingValue(temperatureReading);
  const humidity = parseReadingValue(humidityReading);
  const lightValue = parseReadingValue(lightReading);
  const co2 = parseReadingValue(co2Reading);

  const lightingOn =
    typeof lightValue === "number" ? Math.round(lightValue / 10) : 0;
  const lightingTotal = room.sensors.length || 1;
  const status = determineRoomStatus(temperature, humidity, co2);

  currentRoom = {
    ...room,
    location: room.name,
    capacity: "---",
    area: "---",
    hvacSystem: "---",
    lastMaintenance: "---",
    nextMaintenance: "---",
    temperature:
      typeof temperature === "number" ? Number(temperature.toFixed(1)) : "N/A",
    humidity:
      typeof humidity === "number" ? Number(humidity.toFixed(0)) : "N/A",
    lightingOn,
    lightingTotal,
    badge:
      status === "normal"
        ? "Ativo"
        : status === "attention"
          ? "Atenção"
          : "Alerta",
    co2: typeof co2 === "number" ? co2 : "N/A",
    status,
    statusText: getStatusText(status),
    lastUpdate:
      temperatureReading?.timestamp_leitura ||
      humidityReading?.timestamp_leitura ||
      lightReading?.timestamp_leitura ||
      co2Reading?.timestamp_leitura ||
      "Desconhecido",
    alerts: generateRoomAlerts({ temperature, humidity, co2, status }),
  };
}

function updateRoomHeader() {
  const breadcrumbRoom = document.getElementById("breadcrumb-room");
  const roomTitle = document.getElementById("room-title");
  const roomBadge = document.getElementById("room-badge");
  const statusBadge = document.getElementById("room-status-badge");
  const roomStatusText = document.getElementById("room-status-text");
  const lastUpdate = document.getElementById("last-update");

  if (breadcrumbRoom) breadcrumbRoom.textContent = currentRoom.name;
  if (roomTitle) roomTitle.textContent = `📍 ${currentRoom.name}`;
  if (roomBadge) roomBadge.textContent = currentRoom.badge || "Ativo";

  if (statusBadge) {
    statusBadge.className = `room-status-badge status-${currentRoom.status}`;
  }

  if (roomStatusText) roomStatusText.textContent = currentRoom.statusText;
  if (lastUpdate) lastUpdate.textContent = currentRoom.lastUpdate;
}

function updateRoomStats() {
  const statTemp = document.getElementById("stat-temp");
  const statHumidity = document.getElementById("stat-humidity");
  const statLight = document.getElementById("stat-light");
  const statLightPercent = document.getElementById("stat-light-percent");
  const statCo2 = document.getElementById("stat-co2");

  if (statTemp)
    statTemp.textContent =
      typeof currentRoom.temperature === "number"
        ? `${currentRoom.temperature}°C`
        : `${currentRoom.temperature}`;
  if (statHumidity)
    statHumidity.textContent =
      typeof currentRoom.humidity === "number"
        ? `${currentRoom.humidity}%`
        : `${currentRoom.humidity}`;

  const lightPercentage = currentRoom.lightingTotal
    ? Math.round((currentRoom.lightingOn / currentRoom.lightingTotal) * 100)
    : 0;

  if (statLight)
    statLight.textContent = `${currentRoom.lightingOn}/${currentRoom.lightingTotal}`;
  if (statLightPercent)
    statLightPercent.textContent = `${lightPercentage}% acesas`;
  if (statCo2)
    statCo2.textContent =
      typeof currentRoom.co2 === "number"
        ? `${currentRoom.co2} ppm`
        : `${currentRoom.co2}`;
}

function updateRoomInfo() {
  const infoLocation = document.getElementById("info-location");
  const infoCapacity = document.getElementById("info-capacity");
  const infoArea = document.getElementById("info-area");
  const infoHvac = document.getElementById("info-hvac");
  const infoMaintenance = document.getElementById("info-maintenance");
  const infoNextMaintenance = document.getElementById("info-next-maintenance");

  if (infoLocation)
    infoLocation.textContent = currentRoom.location || currentRoom.name;
  if (infoCapacity) infoCapacity.textContent = currentRoom.capacity || "---";
  if (infoArea) infoArea.textContent = currentRoom.area || "---";
  if (infoHvac) infoHvac.textContent = currentRoom.hvacSystem || "---";
  if (infoMaintenance)
    infoMaintenance.textContent = currentRoom.lastMaintenance || "---";
  if (infoNextMaintenance)
    infoNextMaintenance.textContent = currentRoom.nextMaintenance || "---";
}

function renderAlerts() {
  const alertsList = document.getElementById("alerts-list");

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

  alertsList.innerHTML = "";

  currentRoom.alerts.forEach((alert) => {
    const alertItem = document.createElement("div");
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

function setupControls() {
  const tempSlider = document.getElementById("target-temp-slider");
  const tempValue = document.getElementById("target-temp-value");

  if (tempSlider && tempValue) {
    tempValue.textContent = `${tempSlider.value}°C`;
    tempSlider.addEventListener("input", function () {
      tempValue.textContent = `${this.value}°C`;
    });
  }

  const lightSlider = document.getElementById("light-intensity-slider");
  const lightValue = document.getElementById("light-intensity-value");

  if (lightSlider && lightValue) {
    lightValue.textContent = `${lightSlider.value}%`;
    lightSlider.addEventListener("input", function () {
      lightValue.textContent = `${this.value}%`;
    });
  }

  const ventSlider = document.getElementById("vent-speed-slider");
  const ventValue = document.getElementById("vent-speed-value");
  const speedLabels = ["", "Baixa", "Média", "Alta"];

  if (ventSlider && ventValue) {
    ventValue.textContent = speedLabels[ventSlider.value];
    ventSlider.addEventListener("input", function () {
      ventValue.textContent = speedLabels[this.value];
    });
  }

  const toggleClimate = document.getElementById("toggle-climate");
  const toggleLights = document.getElementById("toggle-lights");
  const toggleVentilation = document.getElementById("toggle-ventilation");
  const climateMode = document.getElementById("climate-mode");

  if (toggleClimate) {
    toggleClimate.addEventListener("change", function () {
      console.log("🌡️ Climatização:", this.checked ? "Ligada" : "Desligada");
    });
  }

  if (toggleLights) {
    toggleLights.addEventListener("change", function () {
      console.log("💡 Iluminação:", this.checked ? "Ligada" : "Desligada");
    });
  }

  if (toggleVentilation) {
    toggleVentilation.addEventListener("change", function () {
      console.log("🌀 Ventilação:", this.checked ? "Ligada" : "Desligada");
    });
  }

  if (climateMode) {
    climateMode.addEventListener("change", function () {
      console.log("🎛️ Modo de climatização alterado para:", this.value);
    });
  }
}

function renderCharts() {
  renderTemperatureChart();
  renderHumidityChart();
}

function renderTemperatureChart() {
  const canvas = document.getElementById("temp-chart-canvas");
  const currentValue = document.getElementById("chart-temp-current");

  if (!canvas || !currentValue) return;

  const tempHistory = generateHistoryData(
    currentRoom.temperature,
    24,
    18,
    27,
    0.5,
  );
  currentValue.textContent =
    typeof currentRoom.temperature === "number"
      ? `${currentRoom.temperature}°C`
      : currentRoom.temperature;

  createLineChart(canvas, tempHistory, "#f97316", 18, 28);
}

function renderHumidityChart() {
  const canvas = document.getElementById("humidity-chart-canvas");
  const currentValue = document.getElementById("chart-humidity-current");

  if (!canvas || !currentValue) return;

  const humidityHistory = generateHistoryData(
    currentRoom.humidity,
    24,
    30,
    70,
    1,
  );
  currentValue.textContent =
    typeof currentRoom.humidity === "number"
      ? `${currentRoom.humidity}%`
      : currentRoom.humidity;

  createLineChart(canvas, humidityHistory, "#3b82f6", 30, 70);
}

function generateHistoryData(currentValue, points, min, max, variance) {
  const data = [];
  const initialValue =
    typeof currentValue === "number" ? currentValue : (min + max) / 2;

  for (let i = 0; i < points; i++) {
    const random = (Math.random() - 0.5) * variance * 2;
    let value = initialValue + random;

    value = Math.max(min, Math.min(max, value));
    value = Math.round(value * 10) / 10;

    data.push(value);
  }

  data[data.length - 1] =
    typeof currentValue === "number" ? currentValue : data[data.length - 1];
  return data;
}

function createLineChart(container, data, color, minValue, maxValue) {
  container.innerHTML = "";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", "0 0 800 250");
  svg.setAttribute("preserveAspectRatio", "none");

  const idealMin = minValue + (maxValue - minValue) * 0.25;
  const idealMax = minValue + (maxValue - minValue) * 0.75;

  const idealMinY = 250 - ((idealMin - minValue) / (maxValue - minValue)) * 250;
  const idealMaxY = 250 - ((idealMax - minValue) / (maxValue - minValue)) * 250;

  const idealZone = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect",
  );
  idealZone.setAttribute("x", "0");
  idealZone.setAttribute("y", idealMaxY);
  idealZone.setAttribute("width", "800");
  idealZone.setAttribute("height", idealMinY - idealMaxY);
  idealZone.setAttribute("fill", color);
  idealZone.setAttribute("opacity", "0.1");
  svg.appendChild(idealZone);

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 800;
      const y = 250 - ((value - minValue) / (maxValue - minValue)) * 250;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,250 ${points} 800,250`;
  const area = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon",
  );
  area.setAttribute("points", areaPoints);
  area.setAttribute("fill", color);
  area.setAttribute("opacity", "0.2");
  svg.appendChild(area);

  const polyline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline",
  );
  polyline.setAttribute("points", points);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", color);
  polyline.setAttribute("stroke-width", "3");
  polyline.setAttribute("stroke-linecap", "round");
  polyline.setAttribute("stroke-linejoin", "round");
  svg.appendChild(polyline);

  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * 800;
    const y = 250 - ((value - minValue) / (maxValue - minValue)) * 250;

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", color);
    circle.setAttribute("opacity", index === data.length - 1 ? "1" : "0.5");

    svg.appendChild(circle);
  });

  container.appendChild(svg);
}

function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userInfoElement = document.getElementById("user-info");

  if (user && userInfoElement) {
    userInfoElement.textContent = `👤 ${user.name}`;
  }
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

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  const adminLink = document.querySelector(".admin-link");

  if (adminLink) {
    adminLink.style.display = user?.role === "Admin" ? "block" : "none";
  }
}

async function initializeRoomDetails() {
  const user = await requireAuth();
  if (!user) return;

  loadUserInfo();
  setupLogout();
  checkAdminAccess();

  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("room") || "sala-101";

  const rooms = await fetchSensorRooms();
  currentRoom = rooms[roomId];

  if (!currentRoom) {
    alert("Sala não encontrada.");
    window.location.href = "departamento.html";
    return;
  }

  await loadRoomActualData(currentRoom);

  updateRoomHeader();
  updateRoomStats();
  updateRoomInfo();
  renderAlerts();
  setupControls();
  renderCharts();
}

document.addEventListener("DOMContentLoaded", initializeRoomDetails);

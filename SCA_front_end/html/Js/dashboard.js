let roomsData = {};

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
    if (!Array.isArray(readings) || readings.length === 0) return null;
    return readings[0];
  } catch (error) {
    console.error("Erro ao carregar leituras do sensor:", error);
    return null;
  }
}

function parseReadingValue(reading) {
  if (!reading || reading.valor === undefined || reading.valor === null) {
    return null;
  }

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

  return "comfortable";
}

function getStatusText(status) {
  switch (status) {
    case "alert":
      return "Atenção — revisão necessária";
    case "attention":
      return "Atenção — monitorar condições";
    default:
      return "Ambiente Confortável";
  }
}

function getAirQualityLabel(co2) {
  if (typeof co2 !== "number") return "Desconhecida";
  if (co2 <= 800) return "Boa";
  if (co2 <= 1000) return "Moderada";
  return "Péssima";
}

async function initializeDashboard() {
  roomsData = await fetchSensorRooms();
  populateRoomSelector();

  const roomKeys = Object.keys(roomsData);
  if (roomKeys.length > 0) {
    await updateRoomData(roomKeys[0]);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const user = await requireAuth();
  if (!user) return;

  initializeHeader();
  await initializeDashboard();
  initializeUserAvatar();
  loadUserInfo();
  setupLogout();
  checkAdminAccess();
  initializeControlMode();
});

function initializeHeader() {
  console.log("Header inicializado");
}

function populateRoomSelector() {
  const roomSelect = document.getElementById("room-select");
  if (!roomSelect) {
    console.error("Seletor de sala não encontrado");
    return;
  }

  roomSelect.innerHTML = "";

  Object.values(roomsData).forEach((room) => {
    const option = document.createElement("option");
    option.value = room.id;
    option.textContent = room.name;
    roomSelect.appendChild(option);
  });

  roomSelect.addEventListener("change", function (e) {
    updateRoomData(e.target.value);
  });
}

async function updateRoomData(roomId) {
  const room = roomsData[roomId];
  if (!room) {
    console.error("Dados da sala não encontrados:", roomId);
    return;
  }

  const temperatureSensor = getSensorByType(room, /temperatura/i);
  const humiditySensor = getSensorByType(room, /humidade/i);
  const lightSensor = getSensorByType(room, /luminosidade/i);
  const co2Sensor = getSensorByType(room, /co2/i);

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

  const airQuality = getAirQualityLabel(co2);
  const status = determineRoomStatus(temperature, humidity, co2);
  const statusText = getStatusText(status);
  const statusIcon =
    status === "comfortable"
      ? "check"
      : status === "attention"
        ? "warning"
        : "alert";

  const roomTitle = document.getElementById("current-room-title");
  if (roomTitle) {
    roomTitle.textContent = `Condições Atuais - ${room.name}`;
  }

  const tempValue = document.getElementById("temperature-value");
  if (tempValue) {
    const target = typeof temperature === "number" ? temperature : 0;
    animateValue(
      tempValue,
      parseFloat(tempValue.textContent) || 0,
      target,
      500,
    );
    tempValue.textContent =
      typeof temperature === "number" ? temperature.toFixed(1) : "N/A";
  }

  const humidityValue = document.getElementById("humidity-value");
  if (humidityValue) {
    const target = typeof humidity === "number" ? humidity : 0;
    animateValue(
      humidityValue,
      parseFloat(humidityValue.textContent) || 0,
      target,
      500,
    );
    humidityValue.textContent =
      typeof humidity === "number" ? humidity.toFixed(0) : "N/A";
  }

  const airQualityValue = document.getElementById("air-quality-value");
  if (airQualityValue) {
    airQualityValue.textContent = airQuality;
  }

  const lightPercentage = document.getElementById("light-percentage");
  if (lightPercentage) {
    lightPercentage.textContent =
      typeof lightValue === "number" ? `${Math.round(lightValue)}` : "N/A";
  }

  const lightInfo = document.querySelector(".light-info");
  if (lightInfo) {
    lightInfo.textContent =
      typeof lightValue === "number"
        ? `Luminosidade atual: ${Math.round(lightValue)} ${lightReading?.unidade || ""}`
        : "Luminosidade indisponível";
  }

  updateComfortStatus(status, statusText, statusIcon);

  console.log("✅ Sala atualizada:", room.name);
}

function updateComfortStatus(status, text, icon) {
  const statusIndicator = document.querySelector(".status-indicator");

  if (!statusIndicator) return;

  statusIndicator.classList.remove(
    "status-comfortable",
    "status-attention",
    "status-alert",
  );
  statusIndicator.classList.add(`status-${status}`);

  const statusText = statusIndicator.querySelector(".status-text");
  if (statusText) {
    statusText.textContent = text;
  }

  const statusIconElement = statusIndicator.querySelector(".status-icon");
  if (statusIconElement) {
    statusIconElement.innerHTML = getStatusIcon(icon);
  }
}

function getStatusIcon(iconType) {
  const icons = {
    check: `
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    `,
    warning: `
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    `,
    alert: `
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    `,
  };

  return icons[iconType] || icons.check;
}

function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;

    if (
      (increment > 0 && current >= end) ||
      (increment < 0 && current <= end)
    ) {
      current = end;
      clearInterval(timer);
    }

    const displayValue = Number.isFinite(end)
      ? Number.isInteger(end)
        ? Math.round(current)
        : current.toFixed(1)
      : end;
    element.textContent = displayValue;
  }, 16);
}

function initializeUserAvatar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const avatarInitials = document.getElementById("user-initials");

  if (user && user.name && avatarInitials) {
    const names = user.name.split(" ");
    const initials =
      names.length >= 2
        ? names[0][0] + names[names.length - 1][0]
        : names[0][0] + (names[0][1] || "");

    avatarInitials.textContent = initials.toUpperCase();
  }
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
    if (user?.role === "Admin") {
      adminLink.style.display = "block";
    } else {
      adminLink.style.display = "none";
    }
  }
}

function initializeControlMode() {
  const toggleModeBtn = document.getElementById("toggle-mode");
  const controlModeSpan = document.getElementById("control-mode");
  const modeDescription = document.getElementById("mode-description");

  if (!toggleModeBtn || !controlModeSpan || !modeDescription) return;

  let currentMode = localStorage.getItem("controlMode") || "Automático";

  function updateModeUI(mode) {
    controlModeSpan.textContent = mode;
    controlModeSpan.classList.remove("automatic", "manual");

    if (mode === "Automático") {
      controlModeSpan.classList.add("automatic");
      modeDescription.textContent =
        "O sistema ajusta automaticamente as condições ambientais.";
      toggleModeBtn.textContent = "Alterar para Manual";
    } else {
      controlModeSpan.classList.add("manual");
      modeDescription.textContent =
        "O utilizador passa a controlar manualmente as definições do sistema.";
      toggleModeBtn.textContent = "Alterar para Automático";
    }
  }

  updateModeUI(currentMode);

  toggleModeBtn.addEventListener("click", function () {
    currentMode = currentMode === "Automático" ? "Manual" : "Automático";
    localStorage.setItem("controlMode", currentMode);
    updateModeUI(currentMode);
  });
}

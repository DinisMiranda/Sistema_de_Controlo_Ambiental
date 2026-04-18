// ========================================
// DADOS SIMULADOS DAS SALAS
// ========================================

const rooms = {
  "sala-101": {
    name: "Sala 101",
    temperature: "22.5",
    humidity: "45",
    airQuality: "Boa",
    status: "comfortable",
  },
  "sala-102": {
    name: "Sala 102",
    temperature: "23.1",
    humidity: "42",
    airQuality: "Boa",
    status: "comfortable",
  },
  "sala-201": {
    name: "Sala 201",
    temperature: "21.8",
    humidity: "48",
    airQuality: "Moderada",
    status: "comfortable",
  },
  auditorio: {
    name: "Auditório Principal",
    temperature: "24.5",
    humidity: "38",
    airQuality: "Boa",
    status: "attention",
  },
  laboratorio: {
    name: "Laboratório A",
    temperature: "20.2",
    humidity: "52",
    airQuality: "Excelente",
    status: "comfortable",
  },
};

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  initializeHeader();
  initializeRoomSelector();
  initializeUserAvatar();
  loadUserInfo();
  setupLogout();
  checkAdminAccess();
});

// ========================================
// HEADER E SELETOR DE SALA
// ========================================

function initializeHeader() {
  console.log("Header inicializado");
}

function initializeRoomSelector() {
  const roomSelect = document.getElementById("room-select");

  if (!roomSelect) {
    console.error("Seletor de sala não encontrado");
    return;
  }

  // Evento de mudança de sala
  roomSelect.addEventListener("change", function (e) {
    const selectedRoom = e.target.value;
    updateRoomData(selectedRoom);
  });

  // Carregar dados da sala inicial
  updateRoomData(roomSelect.value);
}

// ========================================
// DADOS SIMULADOS DAS SALAS (ATUALIZADO)
// ========================================

const roomsData = {
  "sala-101": {
    name: "Sala 101",
    temperature: 22.5,
    humidity: 45,
    airQuality: "Boa",
    status: "comfortable",
    statusText: "Ambiente Confortável",
    statusIcon: "check",
  },
  "sala-102": {
    name: "Sala 102",
    temperature: 23.1,
    humidity: 42,
    airQuality: "Boa",
    status: "comfortable",
    statusText: "Ambiente Confortável",
    statusIcon: "check",
  },
  "sala-201": {
    name: "Sala 201",
    temperature: 21.8,
    humidity: 48,
    airQuality: "Moderada",
    status: "comfortable",
    statusText: "Ambiente Confortável",
    statusIcon: "check",
  },
  auditorio: {
    name: "Auditório Principal",
    temperature: 26.5,
    humidity: 38,
    airQuality: "Boa",
    status: "attention",
    statusText: "Temperatura Elevada",
    statusIcon: "warning",
  },
  laboratorio: {
    name: "Laboratório A",
    temperature: 20.2,
    humidity: 52,
    airQuality: "Excelente",
    status: "comfortable",
    statusText: "Condições Ideais",
    statusIcon: "check",
  },
};

// ========================================
// ATUALIZAR DADOS DA SALA (MELHORADO)
// ========================================

function updateRoomData(roomId) {
  const roomData = roomsData[roomId];

  if (!roomData) {
    console.error("Dados da sala não encontrados:", roomId);
    return;
  }

  // Atualizar título
  const roomTitle = document.getElementById("current-room-title");
  if (roomTitle) {
    roomTitle.textContent = `Condições Atuais - ${roomData.name}`;
  }

  // Atualizar Temperatura
  const tempValue = document.getElementById("temperature-value");
  if (tempValue) {
    animateValue(
      tempValue,
      parseFloat(tempValue.textContent) || 0,
      roomData.temperature,
      500,
    );
  }

  // Atualizar Umidade
  const humidityValue = document.getElementById("humidity-value");
  if (humidityValue) {
    animateValue(
      humidityValue,
      parseFloat(humidityValue.textContent) || 0,
      roomData.humidity,
      500,
    );
  }

  // Atualizar Qualidade do Ar
  const airQualityValue = document.getElementById("air-quality-value");
  if (airQualityValue) {
    airQualityValue.textContent = roomData.airQuality;
  }

  // Atualizar Status de Conforto
  updateComfortStatus(
    roomData.status,
    roomData.statusText,
    roomData.statusIcon,
  );

  console.log("✅ Sala atualizada:", roomData.name);
}

// ========================================
// ATUALIZAR STATUS DE CONFORTO
// ========================================

function updateComfortStatus(status, text, icon) {
  const statusIndicator = document.querySelector(".status-indicator");

  if (!statusIndicator) return;

  // Remover classes anteriores
  statusIndicator.classList.remove(
    "status-comfortable",
    "status-attention",
    "status-alert",
  );

  // Adicionar nova classe
  statusIndicator.classList.add(`status-${status}`);

  // Atualizar texto
  const statusText = statusIndicator.querySelector(".status-text");
  if (statusText) {
    statusText.textContent = text;
  }

  // Atualizar ícone
  const statusIconElement = statusIndicator.querySelector(".status-icon");
  if (statusIconElement) {
    statusIconElement.innerHTML = getStatusIcon(icon);
  }
}

// ========================================
// ÍCONES SVG PARA STATUS
// ========================================

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

// ========================================
// ANIMAÇÃO DE VALORES NUMÉRICOS
// ========================================

function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16); // 60 FPS
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

    // Formatar com 1 casa decimal se for número decimal
    const displayValue = Number.isInteger(end)
      ? Math.round(current)
      : current.toFixed(1);
    element.textContent = displayValue;
  }, 16);
}

// Atualizar título do card
const roomTitle = document.getElementById("current-room-title");
if (roomTitle) {
  roomTitle.textContent = `Condições Atuais - ${roomData.name}`;
}

// Atualizar métricas (você pode expandir isso depois)
console.log("Sala atualizada:", roomData.name);
console.log("Temperatura:", roomData.temperature);
console.log("Humidade:", roomData.humidity);
console.log("Qualidade do Ar:", roomData.airQuality);

// Animação sutil ao trocar
const card = document.querySelector(".card");
if (card) {
  card.style.opacity = "0.7";
  setTimeout(() => {
    card.style.opacity = "1";
  }, 150);
}

// ========================================
// AVATAR DO UTILIZADOR
// ========================================

function initializeUserAvatar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const avatarInitials = document.getElementById("user-initials");

  if (user && user.name && avatarInitials) {
    // Pegar iniciais do nome (ex: "João Silva" → "JS")
    const names = user.name.split(" ");
    const initials =
      names.length >= 2
        ? names[0][0] + names[names.length - 1][0]
        : names[0][0] + (names[0][1] || "");

    avatarInitials.textContent = initials.toUpperCase();
  }
}

// ========================================
// INFO DO UTILIZADOR (já existente)
// ========================================

function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userInfoElement = document.getElementById("user-info");

  if (user && userInfoElement) {
    userInfoElement.textContent = `👤 ${user.name}`;
  }
}

// ========================================
// LOGOUT (já existente)
// ========================================

function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
}

// ========================================
// CONTROLO DE ACESSO ADMIN
// ========================================

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  const adminLink = document.querySelector(".admin-link");

  // Mostrar admin link apenas se o utilizador for admin
  if (adminLink) {
    if (
      user.role === "Admin"
    ) {
      adminLink.style.display = "block";
    } else {
      adminLink.style.display = "none";
    }
  }
}

// ========================================
// CONTROLE DE MODO (já existente)
// ========================================

const toggleModeBtn = document.getElementById("toggle-mode");
const controlModeSpan = document.getElementById("control-mode");

if (toggleModeBtn && controlModeSpan) {
  toggleModeBtn.addEventListener("click", function () {
    const isAutomatic = controlModeSpan.textContent === "Automático";
    controlModeSpan.textContent = isAutomatic ? "Manual" : "Automático";
  });
}

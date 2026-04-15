// ========================================
// DADOS SIMULADOS DAS SALAS
// ========================================

const departmentsData = {
  "sala-101": {
    id: "sala-101",
    name: "Sala 101",
    badge: "Ativo",
    temperature: 22.5,
    humidity: 45,
    lightingOn: 30,
    lightingTotal: 42,
    status: "normal",
    statusText: "Ambiente Normal",
    lastUpdate: "há 2 minutos",
  },
  "sala-102": {
    id: "sala-102",
    name: "Sala 102",
    badge: "Ativo",
    temperature: 23.1,
    humidity: 42,
    lightingOn: 25,
    lightingTotal: 38,
    status: "normal",
    statusText: "Ambiente Normal",
    lastUpdate: "há 1 minuto",
  },
  "sala-201": {
    id: "sala-201",
    name: "Sala 201",
    badge: "Ativo",
    temperature: 21.8,
    humidity: 48,
    lightingOn: 18,
    lightingTotal: 28,
    status: "normal",
    statusText: "Ambiente Normal",
    lastUpdate: "há 3 minutos",
  },
  auditorio: {
    id: "auditorio",
    name: "Auditório Principal",
    badge: "Em Uso",
    temperature: 26.5,
    humidity: 38,
    lightingOn: 42,
    lightingTotal: 42,
    status: "alert",
    statusText: "Temperatura Elevada",
    lastUpdate: "há 1 minuto",
  },
  laboratorio: {
    id: "laboratorio",
    name: "Laboratório A",
    badge: "Ativo",
    temperature: 20.2,
    humidity: 52,
    lightingOn: 28,
    lightingTotal: 28,
    status: "attention",
    statusText: "Umidade Elevada",
    lastUpdate: "há 5 minutos",
  },
};

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🏢 Página de Departamentos inicializando...");

  checkAdminAccess();
  setupLogout();
  renderDepartmentCards();
  setupFilters();
  updateStatistics();

  console.log("✅ Departamentos carregados com sucesso!");
});

// ========================================
// CONTROLO DE ACESSO ADMIN
// ========================================

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  const adminLink = document.querySelector(".admin-link");

  if (adminLink) {
    if (
      user &&
      user.email === "admin@edificio.com" &&
      user.password === "admin123"
    ) {
      adminLink.style.display = "block";
    } else {
      adminLink.style.display = "none";
    }
  }
}

// ========================================
// RENDERIZAR CARDS DE DEPARTAMENTOS
// ========================================

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

// ========================================
// VERIFICAR SE DEVE MOSTRAR SALA
// ========================================

function shouldShowRoom(room, filter) {
  if (filter === "all") return true;

  if (filter === "temperature") {
    return room.temperature < 20 || room.temperature > 24;
  }

  if (filter === "humidity") {
    return room.humidity < 40 || room.humidity > 60;
  }

  if (filter === "light") {
    return true;
  }

  return true;
}

// ========================================
// CRIAR CARD DE DEPARTAMENTO
// ========================================

function createDepartmentCard(room) {
  const card = document.createElement("div");
  card.className = `department-card status-${room.status}`;
  card.setAttribute("data-room-id", room.id);
  card.setAttribute("data-temperature", room.temperature);
  card.setAttribute("data-humidity", room.humidity);

  const lightPercentage = Math.round(
    (room.lightingOn / room.lightingTotal) * 100,
  );
  const tempClass = getTempAlertClass(room.temperature);
  const humidityClass = getHumidityAlertClass(room.humidity);

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

// ========================================
// FUNÇÕES AUXILIARES - ALERTAS
// ========================================

function getTempAlertClass(temp) {
  if (temp < 18 || temp > 26) return "alert";
  if (temp < 20 || temp > 24) return "warning";
  return "";
}

function getHumidityAlertClass(humidity) {
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

// ========================================
// CONFIGURAR FILTROS
// ========================================

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

// ========================================
// ATUALIZAR ESTATÍSTICAS
// ========================================

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

// ========================================
// NAVEGAÇÃO
// ========================================

function goToRoomDetails(roomId) {
  console.log("📍 Navegando para detalhes da sala:", roomId);
  window.location.href = `detalhe_departamento.html?room=${encodeURIComponent(roomId)}`;
}

function goToRoomControl(roomId) {
  console.log("🎛️ Navegando para controle da sala:", roomId);
  window.location.href = `detalhe_departamento.html?room=${encodeURIComponent(roomId)}&scroll=control`;
}

// ========================================
// LOGOUT
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

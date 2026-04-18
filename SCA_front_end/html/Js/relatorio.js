const reportsData = [
  {
    date: "2026-03-20 08:30",
    room: "Sala 101",
    type: "temperatura",
    value: "22.5 °C",
    status: "normal",
    note: "Valor dentro da gama ideal",
  },
  {
    date: "2026-03-20 08:45",
    room: "Sala 101",
    type: "humidade",
    value: "45%",
    status: "normal",
    note: "Humidade estabilizada",
  },
  {
    date: "2026-03-20 09:00",
    room: "Sala 102",
    type: "consumo",
    value: "5.2 kWh",
    status: "normal",
    note: "Consumo regular",
  },
  {
    date: "2026-03-20 09:15",
    room: "Auditório Principal",
    type: "temperatura",
    value: "26.5 °C",
    status: "alert",
    note: "Temperatura acima do ideal",
  },
  {
    date: "2026-03-20 09:20",
    room: "Auditório Principal",
    type: "acao",
    value: "Climatização ligada",
    status: "warning",
    note: "Ação automática aplicada",
  },
  {
    date: "2026-03-19 14:10",
    room: "Laboratório A",
    type: "humidade",
    value: "52%",
    status: "warning",
    note: "Humidade ligeiramente elevada",
  },
  {
    date: "2026-03-19 14:30",
    room: "Laboratório A",
    type: "iluminacao",
    value: "100%",
    status: "normal",
    note: "Iluminação total ativa",
  },
  {
    date: "2026-03-18 11:00",
    room: "Sala 201",
    type: "consumo",
    value: "3.8 kWh",
    status: "normal",
    note: "Abaixo da média semanal",
  },
  {
    date: "2026-03-18 12:10",
    room: "Sala 201",
    type: "acao",
    value: "Modo automático",
    status: "normal",
    note: "Sistema alternado com sucesso",
  },
  {
    date: "2026-03-17 10:40",
    room: "Sala 102",
    type: "iluminacao",
    value: "68%",
    status: "normal",
    note: "Distribuição estável",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  checkAdminAccess();
  setupLogout();
  setupDefaultDates();
  renderReports(reportsData);
  setupEvents();

  const headerLastUpdate = document.getElementById("header-last-update");
  if (headerLastUpdate) {
    headerLastUpdate.textContent = new Date().toLocaleString("pt-PT");
  }
});

// ========================================
// CONTROLO DE ACESSO ADMIN
// ========================================

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  const adminLink = document.querySelector(".admin-link");

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

function setupDefaultDates() {
  const startDate = document.getElementById("start-date");
  const endDate = document.getElementById("end-date");

  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);

  if (startDate) startDate.value = formatDateInput(lastWeek);
  if (endDate) endDate.value = formatDateInput(today);
}

function setupEvents() {
  const applyBtn = document.getElementById("apply-filters");
  const clearBtn = document.getElementById("clear-filters");
  const exportBtn = document.getElementById("btn-export");
  const periodSelect = document.getElementById("filter-period");

  if (applyBtn) applyBtn.addEventListener("click", applyFilters);
  if (clearBtn) clearBtn.addEventListener("click", clearFilters);
  if (exportBtn) exportBtn.addEventListener("click", exportCSV);
  if (periodSelect) periodSelect.addEventListener("change", handlePeriodChange);
}

function handlePeriodChange() {
  const period = document.getElementById("filter-period").value;
  const startDate = document.getElementById("start-date");
  const endDate = document.getElementById("end-date");

  const today = new Date();
  const start = new Date();

  if (period === "today") {
    start.setDate(today.getDate());
  } else if (period === "7days") {
    start.setDate(today.getDate() - 7);
  } else if (period === "30days") {
    start.setDate(today.getDate() - 30);
  } else {
    return;
  }

  startDate.value = formatDateInput(start);
  endDate.value = formatDateInput(today);
}

function applyFilters() {
  const room = document.getElementById("filter-room").value;
  const type = document.getElementById("filter-type").value;
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  const filtered = reportsData.filter((item) => {
    const itemDate = item.date.split(" ")[0];

    const matchesRoom = room === "all" || item.room === room;
    const matchesType = type === "all" || item.type === type;
    const matchesStart = !startDate || itemDate >= startDate;
    const matchesEnd = !endDate || itemDate <= endDate;

    return matchesRoom && matchesType && matchesStart && matchesEnd;
  });

  renderReports(filtered);
}

function clearFilters() {
  document.getElementById("filter-room").value = "all";
  document.getElementById("filter-type").value = "all";
  document.getElementById("filter-period").value = "7days";
  setupDefaultDates();
  renderReports(reportsData);
}

function renderReports(data) {
  const tbody = document.getElementById("reports-table-body");
  const emptyState = document.getElementById("empty-state");
  const resultsCount = document.getElementById("results-count");

  tbody.innerHTML = "";

  if (!data.length) {
    emptyState.style.display = "block";
    resultsCount.textContent = "0 resultados";
    updateSummary([]);
    return;
  }

  emptyState.style.display = "none";
  resultsCount.textContent = `${data.length} resultado${data.length > 1 ? "s" : ""}`;

  data.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.date}</td>
      <td>${item.room}</td>
      <td><span class="type-badge type-${item.type}">${formatType(item.type)}</span></td>
      <td>${item.value}</td>
      <td><span class="status-badge status-${item.status}">${formatStatus(item.status)}</span></td>
      <td>${item.note}</td>
    `;

    tbody.appendChild(row);
  });

  updateSummary(data);
}

function updateSummary(data) {
  const totalEl = document.getElementById("summary-total");
  const consumptionEl = document.getElementById("summary-consumption");
  const alertsEl = document.getElementById("summary-alerts");
  const updateEl = document.getElementById("summary-update");

  totalEl.textContent = data.length;

  const totalConsumption = data
    .filter((item) => item.type === "consumo")
    .reduce((sum, item) => {
      const numeric = parseFloat(item.value.replace("kWh", "").trim());
      return sum + (isNaN(numeric) ? 0 : numeric);
    }, 0);

  consumptionEl.textContent = `${totalConsumption.toFixed(1)} kWh`;

  const alerts = data.filter(
    (item) => item.status === "alert" || item.status === "warning",
  ).length;
  alertsEl.textContent = alerts;

  updateEl.textContent = data.length ? data[0].date : "--";
}

function formatType(type) {
  const labels = {
    temperatura: "Temperatura",
    humidade: "Humidade",
    iluminacao: "Iluminação",
    consumo: "Consumo",
    acao: "Ação",
  };

  return labels[type] || type;
}

function formatStatus(status) {
  const labels = {
    normal: "Normal",
    warning: "Atenção",
    alert: "Alerta",
  };

  return labels[status] || status;
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function exportCSV() {
  const rows = [
    ["Data", "Departamento", "Tipo", "Valor", "Estado", "Observação"],
    ...reportsData.map((item) => [
      item.date,
      item.room,
      formatType(item.type),
      item.value,
      formatStatus(item.status),
      item.note,
    ]),
  ];

  const csvContent = rows.map((row) => row.join(";")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorios_sca.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
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

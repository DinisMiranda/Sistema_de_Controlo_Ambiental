javascript;
let reportsData = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user) return;

  checkAdminAccess();
  setupLogout();
  setupDefaultDates();
  setupEvents();

  await loadReports();

  const headerLastUpdate = document.getElementById("header-last-update");
  if (headerLastUpdate) {
    headerLastUpdate.textContent = new Date().toLocaleString("pt-PT");
  }
});

// ========================================
// BACKEND API
// ========================================

async function loadReports() {
  try {
    // tenta primeiro endpoint inglês
    let response = await fetchWithAuth("/api/reports");

    // fallback automático para endpoints existentes
    if (!response.ok) {
      response = await fetchWithAuth("/api/sensores");
    }

    if (!response.ok) {
      response = await fetchWithAuth("/api/sensores");
    }

    if (!response.ok) {
      throw new Error("Nenhum endpoint disponível");
    }

    const data = await response.json();

    // converte sensores em relatórios visuais
    reportsData = data.map((item) => {
      const sensorType = item.type || item.tipo || "temperatura";
      const sensorValue = item.value || item.valor || 0;

      return {
        date: formatDate(item.updatedAt || item.timestamp || new Date()),
        room: item.room || item.department || item.nome || "Departamento",
        type: normalizeType(sensorType),
        value: formatSensorValue(sensorType, sensorValue),
        status: generateStatus(sensorType, sensorValue),
        note: generateNote(sensorType, sensorValue),
      };
    });

    renderReports(reportsData);
  } catch (error) {
    console.error("Erro ao obter relatórios:", error);

    renderReports([]);

    const tbody = document.getElementById("reports-table-body");

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:20px; color:red;">
            Backend indisponível
          </td>
        </tr>
      `;
    }
  }
}

function normalizeType(type) {
  if (!type) return "desconhecido";

  const map = {
    temperature: "temperatura",
    humidity: "humidade",
    lighting: "iluminacao",
    consumption: "consumo",
    action: "acao",
  };

  return map[type] || type;
}

function formatValue(item) {
  if (item.value !== undefined) {
    return formatSensorValue(item.type, item.value);
  }

  return "--";
}

function formatSensorValue(type, value) {
  if (type === "temperature" || type === "temperatura") {
    return `${value} °C`;
  }

  if (type === "humidity" || type === "humidade") {
    return `${value}%`;
  }

  if (type === "consumption" || type === "consumo") {
    return `${value} kWh`;
  }

  return String(value);
}

function generateStatus(type, value) {
  const numeric = Number(value);

  if (type === "temperature" || type === "temperatura") {
    if (numeric > 26) return "alert";
    if (numeric > 24) return "warning";
  }

  if (type === "humidity" || type === "humidade") {
    if (numeric > 70) return "alert";
    if (numeric > 60) return "warning";
  }

  return "normal";
}

function generateNote(type, value) {
  const status = generateStatus(type, value);

  if (status === "alert") {
    return "Valor crítico detetado";
  }

  if (status === "warning") {
    return "Valor acima do recomendado";
  }

  return "Sistema estável";
}

function formatDate(dateString) {
  if (!dateString) return "--";

  const date = new Date(dateString);

  return date.toLocaleString("pt-PT");
}

// ========================================
// CONTROLO DE ACESSO ADMIN
// ========================================

function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  const adminLink = document.querySelector(".admin-link");

  if (adminLink) {
    if (user.role === "Admin") {
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
    const itemDate = item.date.split(",")[0].split("/").reverse().join("-");

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
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

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
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }
}

router.get("/reports", async (req, res) => {
  const reports = await prisma.readings.findMany({
    orderBy: {
      timestamp: "desc",
    },
    take: 100,
  });

  res.json(reports);
});

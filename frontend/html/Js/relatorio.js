let allRows = [];
let filtered = [];
let sortCol = "data";
let sortDir = "desc";
let page = 1;
const PAGE_SIZE = 15;

function fmtDate(str) {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(str);
  }
}

function rowDate(row) {
  return row.dataRaw || row.data || row.data_hora || row.created_at || row.periodo_fim;
}

function statusBadgeHtml(estado) {
  const label = formatStatusLabel(estado);
  const e = String(estado || "").toLowerCase();
  if (e.includes("normal") || e === "ok") return `<span class="badge badge-grn">${label}</span>`;
  if (e.includes("alert") || e.includes("aviso") || e.includes("warn")) {
    return `<span class="badge badge-ora">${label}</span>`;
  }
  if (e.includes("erro") || e.includes("crit")) return `<span class="badge badge-red">${label}</span>`;
  return `<span class="badge badge-grey">${label}</span>`;
}

function typeBadgeHtml(tipo) {
  const label = formatTypeLabel(tipo);
  const t = String(tipo || "").toLowerCase();
  if (t.includes("temp")) return `<span class="badge badge-ora">${label}</span>`;
  if (t.includes("hum")) return `<span class="badge badge-blue">${label}</span>`;
  if (t.includes("consumo")) return `<span class="badge badge-yel">${label}</span>`;
  return `<span class="badge badge-grey">${label}</span>`;
}

function formatTypeLabel(type) {
  const labels = {
    temperatura: "Temperatura",
    humidade: "Humidade",
    iluminacao: "Iluminação",
    consumo: "Consumo",
    acao: "Ação",
  };
  return labels[type] || type || "—";
}

function formatStatusLabel(status) {
  const labels = { normal: "Normal", warning: "Atenção", alert: "Alerta" };
  return labels[status] || status || "—";
}

function normalizeApiRow(item) {
  const tipoRaw = item.type || item.tipo || "consumo";
  const tipo = normalizeType(tipoRaw);
  const valorNum = item.consumo ?? item.value ?? item.valor ?? 0;
  const dataRaw = item.periodo_fim || item.periodo_inicio || item.updatedAt || item.timestamp || new Date();
  const departamento = item.room || item.department || item.nome || item.localizacao || "—";
  const estado = generateStatus(tipo, valorNum);

  return {
    dataRaw,
    data: fmtDate(dataRaw),
    departamento,
    tipo,
    valor: valorNum,
    valorDisplay: formatSensorValue(tipo, valorNum),
    unidade: item.unidade || (tipo === "consumo" ? "kWh" : ""),
    estado,
    observacao: generateNote(tipo, valorNum),
  };
}

function normalizeType(type) {
  if (!type) return "consumo";
  const map = {
    temperature: "temperatura",
    humidity: "humidade",
    lighting: "iluminacao",
    consumption: "consumo",
    action: "acao",
    consumo: "consumo",
  };
  const key = String(type).toLowerCase();
  return map[key] || key;
}

function formatSensorValue(type, value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  if (type === "temperatura") return `${n} °C`;
  if (type === "humidade") return `${n}%`;
  if (type === "consumo") return `${n} kWh`;
  return String(value);
}

function generateStatus(type, value) {
  const numeric = Number(value);
  if (type === "temperatura") {
    if (numeric > 26) return "alert";
    if (numeric > 24) return "warning";
  }
  if (type === "humidade") {
    if (numeric > 70) return "alert";
    if (numeric > 60) return "warning";
  }
  return "normal";
}

function generateNote(type, value) {
  const status = generateStatus(type, value);
  if (status === "alert") return "Valor crítico detetado";
  if (status === "warning") return "Valor acima do recomendado";
  return "Registo de consumo energético";
}

function updateSummary() {
  const total = filtered.length;
  document.getElementById("summary-total").textContent = String(total);

  const alerts = filtered.filter((r) => {
    const e = String(r.estado || "").toLowerCase();
    return e.includes("alert") || e.includes("warning") || e.includes("aviso");
  }).length;
  document.getElementById("summary-alerts").textContent = String(alerts);

  const kWh = filtered
    .filter((r) => r.tipo === "consumo")
    .reduce((acc, r) => acc + Number(r.valor || 0), 0);
  document.getElementById("summary-consumption").textContent =
    kWh > 0 ? `${Math.round(kWh).toLocaleString("pt-PT")} kWh` : "—";

  const now = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("summary-update").textContent = now;
  const headerUpdate = document.getElementById("header-last-update");
  if (headerUpdate) headerUpdate.textContent = now;
}

function renderTable() {
  const tbody = document.getElementById("reports-table-body");
  const empty = document.getElementById("empty-state");
  const pag = document.getElementById("pagination");
  const tblWrap = document.querySelector(".table-panel .tbl-wrap");

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) page = totalPages;

  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  document.getElementById("results-count").textContent =
    `${total} resultado${total !== 1 ? "s" : ""}`;

  if (!total) {
    tbody.innerHTML = "";
    empty.classList.add("visible");
    if (tblWrap) tblWrap.style.display = "none";
    pag.style.display = "none";
    updateSummary();
    return;
  }

  empty.classList.remove("visible");
  if (tblWrap) tblWrap.style.display = "";
  pag.style.display = "flex";

  tbody.innerHTML = slice
    .map(
      (r) => `
    <tr>
      <td class="mono">${r.data}</td>
      <td class="primary">${r.departamento}</td>
      <td>${typeBadgeHtml(r.tipo)}</td>
      <td class="val">${r.valorDisplay}</td>
      <td>${statusBadgeHtml(r.estado)}</td>
      <td>${r.observacao}</td>
    </tr>`,
    )
    .join("");

  renderPagination(total, totalPages);
  updateSummary();
}

function renderPagination(total, totalPages) {
  const info = document.getElementById("pag-info");
  const ctrl = document.getElementById("pag-controls");
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  info.textContent = `${from}–${to} de ${total}`;

  let html = `<button type="button" class="pag-btn" id="pag-prev" ${page === 1 ? "disabled" : ""}><i class="ti ti-chevron-left"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - page) > 1) {
      if (i === 3 || i === totalPages - 2) html += `<button type="button" class="pag-btn" disabled>…</button>`;
      continue;
    }
    html += `<button type="button" class="pag-btn ${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button type="button" class="pag-btn" id="pag-next" ${page === totalPages ? "disabled" : ""}><i class="ti ti-chevron-right"></i></button>`;
  ctrl.innerHTML = html;

  ctrl.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      page = Number(btn.dataset.page);
      renderTable();
    });
  });
  document.getElementById("pag-prev")?.addEventListener("click", () => {
    if (page > 1) {
      page--;
      renderTable();
    }
  });
  document.getElementById("pag-next")?.addEventListener("click", () => {
    if (page < totalPages) {
      page++;
      renderTable();
    }
  });
}

function sortFiltered() {
  filtered.sort((a, b) => {
    let va;
    let vb;
    if (sortCol === "data") {
      va = new Date(rowDate(a)).getTime();
      vb = new Date(rowDate(b)).getTime();
    } else if (sortCol === "valor") {
      va = Number(a.valor);
      vb = Number(b.valor);
    } else {
      va = String(a[sortCol] || "").toLowerCase();
      vb = String(b[sortCol] || "").toLowerCase();
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

function applyFilters() {
  const room = document.getElementById("filter-room").value;
  const type = document.getElementById("filter-type").value;
  const period = document.getElementById("filter-period").value;
  const start = document.getElementById("start-date").value;
  const end = document.getElementById("end-date").value;

  const now = new Date();
  let dateFrom = null;
  let dateTo = null;

  if (period === "today") {
    dateFrom = new Date();
    dateFrom.setHours(0, 0, 0, 0);
  } else if (period === "7days") {
    dateFrom = new Date(Date.now() - 7 * 86400000);
  } else if (period === "30days") {
    dateFrom = new Date(Date.now() - 30 * 86400000);
  } else if (period === "custom") {
    if (start) dateFrom = new Date(start);
    if (end) dateTo = new Date(`${end}T23:59:59`);
  }

  filtered = allRows.filter((r) => {
    if (room !== "all") {
      const loc = String(r.departamento || "").toLowerCase();
      if (!loc.includes(room.toLowerCase())) return false;
    }
    if (type !== "all" && r.tipo !== type) return false;

    if (dateFrom || dateTo) {
      const d = new Date(rowDate(r));
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    return true;
  });

  sortCol = "data";
  sortDir = "desc";
  sortFiltered();
  page = 1;
  renderTable();
}

function clearFilters() {
  document.getElementById("filter-room").value = "all";
  document.getElementById("filter-type").value = "all";
  document.getElementById("filter-period").value = "7days";
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value = "";
  handlePeriodChange();
  filtered = [...allRows];
  sortFiltered();
  page = 1;
  renderTable();
}

function handlePeriodChange() {
  const show = document.getElementById("filter-period").value === "custom";
  document.getElementById("date-start-group")?.classList.toggle("active", show);
  document.getElementById("date-end-group")?.classList.toggle("active", show);
}

function exportCSV() {
  if (!filtered.length) return;

  const header = ["Data", "Departamento", "Tipo", "Valor", "Estado", "Observação"].join(";");
  const rows = filtered.map((r) =>
    [r.data, r.departamento, formatTypeLabel(r.tipo), r.valorDisplay, formatStatusLabel(r.estado), r.observacao]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";"),
  );

  const csv = ["\uFEFF" + header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio_sca_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function loadRoomFilter() {
  const select = document.getElementById("filter-room");
  if (!select) return;

  try {
    const res = await fetchWithAuth("/api/salas");
    if (!res.ok) return;
    const salas = await res.json();
    salas.forEach((s) => {
      const name = s.name || s.nome;
      if (!name) return;
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  } catch {
    /* ignore */
  }
}

async function loadReports() {
  const tbody = document.getElementById("reports-table-body");
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6">A carregar dados…</td></tr>';

  try {
    let response = await fetchWithAuth("/api/reports");
    if (!response.ok) {
      response = await fetchWithAuth("/api/consumo/consumption");
    }
    if (!response.ok) throw new Error("API indisponível");

    const data = await response.json();
    allRows = (Array.isArray(data) ? data : []).map(normalizeApiRow);
  } catch (err) {
    console.error(err);
    allRows = [];
    tbody.innerHTML =
      '<tr class="error-row"><td colspan="6">Erro ao carregar relatórios. Verifica se o backend está a correr.</td></tr>';
    filtered = [];
    updateSummary();
    return;
  }

  filtered = [...allRows];
  sortFiltered();
  page = 1;
  applyFilters();
}

function setupSorting() {
  document.querySelectorAll("th[data-col]").forEach((th) => {
    th.addEventListener("click", () => {
      const col = th.dataset.col;
      if (sortCol === col) sortDir = sortDir === "asc" ? "desc" : "asc";
      else {
        sortCol = col;
        sortDir = "asc";
      }

      document.querySelectorAll("th[data-col]").forEach((t) => t.classList.remove("sorted"));
      th.classList.add("sorted");
      const icon = th.querySelector(".sort-icon");
      if (icon) {
        icon.className = `sort-icon ti ${sortDir === "asc" ? "ti-chevron-up" : "ti-chevron-down"}`;
      }

      sortFiltered();
      page = 1;
      renderTable();
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user) return;

  setupShell("relatorios");
  startTimestampClock();
  handlePeriodChange();

  document.getElementById("apply-filters")?.addEventListener("click", applyFilters);
  document.getElementById("clear-filters")?.addEventListener("click", clearFilters);
  document.getElementById("filter-period")?.addEventListener("change", handlePeriodChange);
  document.getElementById("btn-export")?.addEventListener("click", exportCSV);
  document.getElementById("btn-export-hero")?.addEventListener("click", exportCSV);
  document.getElementById("btn-refresh")?.addEventListener("click", loadReports);

  setupSorting();
  await loadRoomFilter();
  await loadReports();

  setInterval(loadReports, 60000);
});

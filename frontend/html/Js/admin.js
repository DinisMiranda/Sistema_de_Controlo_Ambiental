let pendingDeleteFn = null;
let editingHomeId = null;
let editingParameterId = null;
let editingType = null;
let deviceType = "sensor";
let salasCache = [];

function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}

function setupModals() {
  document.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", () => closeModal(el.dataset.close));
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.open").forEach((m) => m.classList.remove("open"));
    }
  });

  document.getElementById("confirm-delete-btn")?.addEventListener("click", () => {
    if (typeof pendingDeleteFn === "function") pendingDeleteFn();
    pendingDeleteFn = null;
    closeModal("delete-modal");
  });
}

function confirmDelete(name, onConfirm) {
  const label = document.getElementById("delete-target-name");
  if (label) label.textContent = name || "este item";
  pendingDeleteFn = onConfirm;
  openModal("delete-modal");
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add("active");
    });
  });
}

function setupTableSearch(inputId, tbodyId) {
  const input = document.getElementById(inputId);
  const tbody = document.getElementById(tbodyId);
  if (!input || !tbody) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    tbody.querySelectorAll("tr").forEach((row) => {
      if (row.querySelector(".empty")) return;
      row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

function roleBadge(admin) {
  return admin
    ? '<span class="badge badge-ora">Admin</span>'
    : '<span class="badge badge-grey">User</span>';
}

function statusBadge(estado) {
  const active =
    estado === true ||
    String(estado).toLowerCase() === "ativo" ||
    String(estado).toLowerCase() === "active";
  return active
    ? '<span class="badge badge-grn">Ativo</span>'
    : '<span class="badge badge-red">Inativo</span>';
}

function actionButtons({ onEdit, onDelete }) {
  const editBtn = onEdit
    ? `<button type="button" class="btn btn-ghost btn-sm edit-btn"><i class="ti ti-pencil"></i>Editar</button>`
    : "";
  const deleteBtn = `<button type="button" class="btn btn-danger btn-sm delete-btn"><i class="ti ti-trash"></i></button>`;
  const cell = document.createElement("div");
  cell.className = "act-cell";
  cell.innerHTML = editBtn + deleteBtn;
  if (onEdit) cell.querySelector(".edit-btn")?.addEventListener("click", onEdit);
  cell.querySelector(".delete-btn")?.addEventListener("click", onDelete);
  return cell;
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user) return;

  const isAdmin = user?.role?.toLowerCase() === "admin" || user?.admin === true;
  if (!isAdmin) {
    window.location.href = "dashboard.html";
    return;
  }

  setupShell("admin");
  startTimestampClock();
  setupModals();
  setupTabs();
  setupTableSearch("users-search", "users-table-body");
  setupTableSearch("history-search", "history-table-body");

  bindUserForm();
  bindHomeForm();
  bindParameterForm();
  bindTypeForm();
  bindDeviceForm();

  try {
    await loadUsers().then(populateUsersTable);
  } catch (e) {
    console.error("Users:", e);
  }

  try {
    await loadSensorsAndActuators();
  } catch (e) {
    console.error("Devices:", e);
  }

  try {
    await loadSalas();
  } catch (e) {
    console.error("Salas:", e);
  }

  try {
    await loadParametros();
  } catch (e) {
    console.error("Parametros:", e);
  }

  try {
    await loadTipos();
  } catch (e) {
    console.error("Tipos:", e);
  }
});

async function loadUsers() {
  const response = await fetchWithAuth("/api/users");
  if (!response.ok) {
    console.error("Erro ao carregar utilizadores");
    return [];
  }
  return response.json();
}

async function createUser(name, email, password, isAdmin = false) {
  const response = await fetchWithAuth("/api/users", {
    method: "POST",
    body: JSON.stringify({ nome: name, email, password, admin: isAdmin }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fieldInfo = data.fields ? ` (campos: ${data.fields.join(", ")})` : "";
    throw new Error((data.error || "Erro ao criar utilizador") + fieldInfo);
  }
  return data;
}

async function deleteUser(userId) {
  const response = await fetchWithAuth(`/api/users/${userId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Erro ao apagar utilizador");
}

function populateUsersTable(users) {
  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!users.length) {
    tbody.innerHTML =
      '<tr><td colspan="5"><div class="empty"><i class="ti ti-users"></i>Sem utilizadores</div></td></tr>';
    return;
  }

  users.forEach((u) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td class="primary">${u.nome}</td>
      <td>${u.email}</td>
      <td>—</td>
      <td>${roleBadge(u.admin)}</td>
      <td></td>
    `;
    const actions = row.cells[4];
    actions.appendChild(
      actionButtons({
        onDelete: () =>
          confirmDelete(u.nome, async () => {
            try {
              await deleteUser(u.id_administrador);
              populateUsersTable(await loadUsers());
            } catch (err) {
              alert(err.message);
            }
          }),
      }),
    );
  });
}

function bindUserForm() {
  const userModal = document.getElementById("user-modal");
  const userForm = document.getElementById("user-form");

  document.getElementById("add-user")?.addEventListener("click", () => {
    document.getElementById("user-modal-title").textContent = "Adicionar Utilizador";
    userForm?.reset();
    openModal("user-modal");
  });

  userForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("input-user-name")?.value.trim();
    const email = document.getElementById("input-user-email")?.value.trim();
    const password = document.getElementById("input-user-password")?.value;
    const role = document.getElementById("input-user-role")?.value || "User";
    const isAdmin = role === "Admin";

    if (!name || !email || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      alert("A password deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      await createUser(name, email, password, isAdmin);
      closeModal("user-modal");
      userForm.reset();
      populateUsersTable(await loadUsers());
    } catch (err) {
      alert(err.message);
    }
  });
}

const homesTableBody = () => document.getElementById("homes-table-body");
const homeModal = () => document.getElementById("home-modal");
const homeForm = () => document.getElementById("home-form");
const homeModalTitle = () => document.getElementById("home-modal-title");

async function loadSalas() {
  try {
    const response = await fetchWithAuth("/api/casas");
    if (!response.ok) throw new Error("Erro ao carregar casas");
    const salas = await response.json();
    salasCache = salas.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location || "—",
      type: s.type || "—",
    }));
    renderSalasTable();
  } catch (err) {
    console.error(err);
  }
}

function renderSalasTable() {
  const tbody = homesTableBody();
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!salasCache.length) {
    tbody.innerHTML =
      '<tr><td colspan="5"><div class="empty"><i class="ti ti-building"></i>Sem casas</div></td></tr>';
    return;
  }
  salasCache.forEach(addSalaRow);
}

function addSalaRow(sala) {
  const tbody = homesTableBody();
  if (!tbody) return;
  const row = tbody.insertRow();
  row.innerHTML = `
    <td class="mono">${sala.id}</td>
    <td class="primary">${sala.name}</td>
    <td>${sala.location}</td>
    <td><span class="badge badge-grey">${sala.type}</span></td>
    <td></td>
  `;
  row.cells[4].appendChild(
    actionButtons({
      onEdit: () => openHomeModal(sala.id),
      onDelete: () =>
        confirmDelete(sala.name, async () => {
          try {
            const response = await fetchWithAuth(`/api/casas/${sala.id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Erro ao apagar casa");
            await loadSalas();
          } catch (err) {
            alert(err.message || "Não foi possível apagar a casa.");
          }
        }),
    }),
  );
}

function openHomeModal(homeId = null) {
  editingHomeId = homeId;
  const form = homeForm();
  if (homeId) {
    const sala = salasCache.find((s) => s.id === homeId);
    if (sala) {
      homeModalTitle().textContent = "Editar Casa";
      document.getElementById("home-name").value = sala.name;
      document.getElementById("home-location").value = sala.location;
      document.getElementById("home-type").value = sala.type;
    }
  } else {
    homeModalTitle().textContent = "Adicionar Casa";
    form?.reset();
  }
  openModal("home-modal");
}

function bindHomeForm() {
  document.getElementById("add-home")?.addEventListener("click", () => openHomeModal());

  homeForm()?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("home-name").value.trim();
    const location = document.getElementById("home-location").value.trim();
    const type = document.getElementById("home-type").value.trim();

    if (!name || !location || !type) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const body = { nome: name, morada: location, codigo_postal: type };

    try {
      const response = editingHomeId
        ? await fetchWithAuth(`/api/casas/${editingHomeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetchWithAuth("/api/casas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!response.ok) throw new Error("Erro ao guardar casa");
      await loadSalas();
      closeModal("home-modal");
      homeForm().reset();
      editingHomeId = null;
    } catch (err) {
      alert(err.message || "Não foi possível guardar a casa.");
    }
  });
}

const parametersTableBody = () => document.getElementById("parameters-table-body");
const parameterModal = () => document.getElementById("parameter-modal");
const parameterForm = () => document.getElementById("parameter-form");
const parameterModalTitle = () => document.getElementById("parameter-modal-title");

async function loadParametros() {
  try {
    const response = await fetchWithAuth("/api/automatic-parameters");
    if (!response.ok) throw new Error(`Erro ${response.status} ao carregar parâmetros`);
    const params = await response.json();
    renderParametersTable(params);
  } catch (err) {
    console.error(err);
  }
}

function renderParametersTable(params) {
  const tbody = parametersTableBody();
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!params.length) {
    tbody.innerHTML =
      '<tr><td colspan="6"><div class="empty"><i class="ti ti-adjustments-horizontal"></i>Sem parâmetros</div></td></tr>';
    return;
  }
  params.forEach(addParameterRow);
}

function addParameterRow(param) {
  const tbody = parametersTableBody();
  if (!tbody) return;
  const row = tbody.insertRow();
  row.innerHTML = `
    <td class="mono">${param.id_parametro}</td>
    <td class="primary">${param.nome_parametro}</td>
    <td>${param.descricao || "—"}</td>
    <td class="mono">${param.valor_parametro}</td>
    <td class="mono">${param.atuadores_id_atuador}</td>
    <td></td>
  `;
  row.cells[5].appendChild(
    actionButtons({
      onEdit: () => openParameterModal(param.id_parametro, param),
      onDelete: () =>
        confirmDelete(param.nome_parametro, async () => {
          try {
            const response = await fetchWithAuth(
              `/api/automatic-parameters/${param.id_parametro}`,
              { method: "DELETE" },
            );
            if (!response.ok) {
              const data = await response.json().catch(() => ({}));
              throw new Error(data.error || "Erro ao apagar parâmetro");
            }
            await loadParametros();
          } catch (err) {
            alert(err.message);
          }
        }),
    }),
  );
}

const DEFAULT_ATUADORES = [
  { nome: "Iluminação Principal", tipo_atuador: "Iluminação", localizacao: "Geral" },
  { nome: "Climatização Central", tipo_atuador: "Temperatura", localizacao: "Geral" },
  { nome: "Ventilação Central", tipo_atuador: "Ventilação", localizacao: "Geral" },
];

async function seedDefaultAtuadores() {
  for (const data of DEFAULT_ATUADORES) {
    await createAtuador(data);
  }
}

async function populateAtuadorSelect(select, param = null) {
  select.innerHTML = '<option value="">A carregar atuadores…</option>';
  select.disabled = true;

  const existing = document.getElementById("atuador-seed-hint");
  if (existing) existing.remove();

  try {
    const atuadores = await loadAtuadores();

    if (!atuadores?.length) {
      select.innerHTML = '<option value="">Nenhum atuador disponível</option>';
      select.disabled = false;

      const hint = document.createElement("div");
      hint.id = "atuador-seed-hint";
      hint.className = "seed-hint";
      hint.innerHTML = `
        <span>Sem atuadores na base de dados.</span>
        <button type="button" id="seed-atuadores-btn" class="btn btn-ghost btn-sm">Criar atuadores padrão</button>
      `;
      select.parentElement?.appendChild(hint);

      document.getElementById("seed-atuadores-btn")?.addEventListener("click", async () => {
        hint.innerHTML = "<span>A criar atuadores…</span>";
        try {
          await seedDefaultAtuadores();
          hint.remove();
          await populateAtuadorSelect(select, param);
          await loadSensorsAndActuators();
        } catch (err) {
          hint.innerHTML = `<span style="color:var(--red)">Erro: ${err.message}</span>`;
        }
      });
      return;
    }

    select.innerHTML = '<option value="">Selecionar atuador…</option>';
    atuadores.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.id_atuador;
      opt.textContent = `${a.nome} — ${a.tipo_atuador || "Atuador"} | ${a.localizacao || "—"}`;
      if (param && a.id_atuador === param.atuadores_id_atuador) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    select.innerHTML = `<option value="">Erro: ${err.message}</option>`;
  } finally {
    select.disabled = false;
  }
}

async function openParameterModal(parameterId = null, param = null) {
  editingParameterId = parameterId;

  if (parameterId && param) {
    parameterModalTitle().textContent = "Editar Parâmetro";
    document.getElementById("parameter-name").value = param.nome_parametro;
    document.getElementById("parameter-description").value = param.descricao || "";
    document.getElementById("parameter-minValue").value = param.valor_parametro;
  } else {
    parameterModalTitle().textContent = "Adicionar Parâmetro";
    parameterForm()?.reset();
  }

  openModal("parameter-modal");
  const select = document.getElementById("parameter-atuador");
  if (select) await populateAtuadorSelect(select, param);
}

function bindParameterForm() {
  document.getElementById("add-parameter")?.addEventListener("click", () => openParameterModal());

  parameterForm()?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome_parametro = document.getElementById("parameter-name").value.trim();
    const descricao = document.getElementById("parameter-description").value.trim();
    const valor_parametro = document.getElementById("parameter-minValue").value.trim();
    const atuadores_id_atuador = document.getElementById("parameter-atuador").value;

    if (!nome_parametro || !valor_parametro) {
      alert("Por favor, preencha o nome e o valor.");
      return;
    }
    if (!atuadores_id_atuador) {
      alert("Por favor, selecione um atuador.");
      return;
    }

    try {
      if (editingParameterId) {
        const response = await fetchWithAuth(`/api/automatic-parameters/${editingParameterId}`, {
          method: "PATCH",
          body: JSON.stringify({
            nome_parametro,
            valor_parametro,
            descricao,
            atuadores_id_atuador: Number(atuadores_id_atuador),
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao atualizar parâmetro");
        }
      } else {
        const response = await fetchWithAuth("/api/automatic-parameters", {
          method: "POST",
          body: JSON.stringify({
            nome_parametro,
            valor_parametro,
            descricao,
            atuadores_id_atuador: Number(atuadores_id_atuador),
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao criar parâmetro");
        }
      }

      closeModal("parameter-modal");
      parameterForm().reset();
      editingParameterId = null;
      await loadParametros();
    } catch (err) {
      alert(err.message);
    }
  });
}

const typesTableBody = () => document.getElementById("types-table-body");
const typeModal = () => document.getElementById("type-modal");
const typeForm = () => document.getElementById("type-form");
const typeModalTitle = () => document.getElementById("type-modal-title");

async function loadTipos() {
  try {
    const response = await fetchWithAuth("/api/tipos");
    if (!response.ok) throw new Error(`Erro ${response.status} ao carregar tipos`);
    const tipos = await response.json();
    renderTypesTable(tipos);
  } catch (err) {
    console.error(err);
  }
}

function renderTypesTable(tipos) {
  const tbody = typesTableBody();
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!tipos.length) {
    tbody.innerHTML =
      '<tr><td colspan="5"><div class="empty"><i class="ti ti-tags"></i>Sem tipos</div></td></tr>';
    return;
  }
  tipos.forEach((tipo, index) => addTypeRow(tipo, index));
}

function categoryBadge(classe) {
  const c = String(classe).toLowerCase();
  const cls = c.includes("atuador") ? "badge-yel" : "badge-ora";
  return `<span class="badge ${cls}">${classe}</span>`;
}

function addTypeRow(tipo, index) {
  const tbody = typesTableBody();
  if (!tbody) return;
  const row = tbody.insertRow();
  row.innerHTML = `
    <td class="mono">${index + 1}</td>
    <td class="primary">${tipo.tipo}</td>
    <td>${tipo.descricao}</td>
    <td>${categoryBadge(tipo.classe)}</td>
    <td></td>
  `;
  row.cells[4].appendChild(
    actionButtons({
      onEdit: () => openTypeModal(tipo),
      onDelete: () =>
        confirmDelete(tipo.tipo, async () => {
          try {
            const response = await fetchWithAuth(
              `/api/tipos/${encodeURIComponent(tipo.classe)}/${encodeURIComponent(tipo.tipo)}`,
              { method: "DELETE" },
            );
            if (!response.ok) {
              const data = await response.json().catch(() => ({}));
              throw new Error(data.error || "Erro ao apagar tipo");
            }
            await loadTipos();
          } catch (err) {
            alert(err.message);
          }
        }),
    }),
  );
}

function openTypeModal(tipo = null) {
  if (tipo) {
    editingType = { classe: tipo.classe, tipo: tipo.tipo };
    typeModalTitle().textContent = "Editar Tipo";
    document.getElementById("type-name").value = tipo.tipo;
    document.getElementById("type-description").value = tipo.descricao;
    document.getElementById("type-category").value = tipo.classe;
  } else {
    editingType = null;
    typeModalTitle().textContent = "Adicionar Tipo";
    typeForm()?.reset();
  }
  openModal("type-modal");
}

function bindTypeForm() {
  document.getElementById("add-type")?.addEventListener("click", () => openTypeModal());

  typeForm()?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const tipo = document.getElementById("type-name").value.trim();
    const descricao = document.getElementById("type-description").value.trim();
    const classe = document.getElementById("type-category").value;

    if (!tipo || !descricao || !classe) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      if (editingType) {
        const response = await fetchWithAuth(
          `/api/tipos/${encodeURIComponent(editingType.classe)}/${encodeURIComponent(editingType.tipo)}`,
          { method: "PATCH", body: JSON.stringify({ classe, tipo, descricao }) },
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao atualizar tipo");
        }
      } else {
        const response = await fetchWithAuth("/api/tipos", {
          method: "POST",
          body: JSON.stringify({ classe, tipo, descricao }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao criar tipo");
        }
      }

      closeModal("type-modal");
      typeForm().reset();
      editingType = null;
      await loadTipos();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function loadSensores() {
  const response = await fetchWithAuth("/api/sensores");
  if (!response.ok) throw new Error("Erro ao carregar sensores");
  return response.json();
}

async function loadAtuadores() {
  const response = await fetchWithAuth("/api/atuadores");
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(`Erro ${response.status}: ${data.error || response.statusText}`);
  }
  return response.json();
}

async function createSensor(data) {
  const response = await fetchWithAuth("/api/sensores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: data.nome,
      tipo_sensor: data.tipo_sensor,
      localizacao: data.localizacao,
      estado: "ativo",
      Tipos_classe: "Sensor",
      Tipos_tipo: data.tipo_sensor,
    }),
  });
  const res = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(res.error || "Erro ao criar sensor");
  return res;
}

async function createAtuador(data) {
  const response = await fetchWithAuth("/api/atuadores", {
    method: "POST",
    body: JSON.stringify({
      nome: data.nome,
      tipo_atuador: data.tipo_atuador,
      localizacao: data.localizacao,
      estado: "ativo",
      Tipos_classe: "Atuador",
      Tipos_tipo: data.tipo_atuador,
    }),
  });
  const res = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(res.error || res.message || "Erro ao criar atuador");
  return res;
}

async function deleteSensor(id) {
  const response = await fetchWithAuth(`/api/sensores/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Erro ao apagar sensor");
}

async function deleteAtuador(id) {
  const response = await fetchWithAuth(`/api/atuadores/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Erro ao apagar atuador");
}

function populateSensorsActuatorsTable(sensores, atuadores) {
  const tbody = document.getElementById("sensors-actuators-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const rows = [
    ...sensores.map((s) => ({
      id: s.id_sensor,
      kind: "sensor",
      nome: s.nome,
      tipo: s.tipo_sensor || "Sensor",
      localizacao: s.localizacao || "—",
      estado: s.estado,
    })),
    ...atuadores.map((a) => ({
      id: a.id_atuador,
      kind: "atuador",
      nome: a.nome,
      tipo: a.tipo_atuador || "Atuador",
      localizacao: a.localizacao || "—",
      estado: a.estado,
    })),
  ];

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="6"><div class="empty"><i class="ti ti-cpu"></i>Sem dispositivos</div></td></tr>';
    return;
  }

  rows.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mono">${item.id}</td>
      <td class="primary">${item.nome}</td>
      <td>${item.tipo}</td>
      <td>${item.localizacao}</td>
      <td>${statusBadge(item.estado)}</td>
      <td></td>
    `;
    row.cells[5].appendChild(
      actionButtons({
        onDelete: () =>
          confirmDelete(item.nome, async () => {
            try {
              if (item.kind === "sensor") await deleteSensor(item.id);
              else await deleteAtuador(item.id);
              await loadSensorsAndActuators();
            } catch (err) {
              alert(err.message);
            }
          }),
      }),
    );
    tbody.appendChild(row);
  });
}

async function loadSensorsAndActuators() {
  try {
    const [sensores, atuadores] = await Promise.all([loadSensores(), loadAtuadores()]);
    populateSensorsActuatorsTable(sensores, atuadores);
  } catch (err) {
    console.error("Erro ao carregar sensores/atuadores:", err);
  }
}

const SENSOR_TIPOS = [
  { value: "Luminosidade", label: "Luminosidade" },
  { value: "Temperatura_ambiente", label: "Temperatura Ambiente" },
  { value: "Humidade_relativa", label: "Humidade Relativa" },
  { value: "Consumo_energetico_kWh", label: "Consumo Energético (kWh)" },
];

const ATUADOR_TIPOS = [
  { value: "Iluminação", label: "Iluminação" },
  { value: "Temperatura", label: "Temperatura" },
  { value: "Ventilação", label: "Ventilação" },
];

function openDeviceModal(type = "sensor") {
  deviceType = type;
  document.getElementById("device-modal-title").textContent =
    type === "sensor" ? "Adicionar Sensor" : "Adicionar Atuador";
  document.getElementById("device-form")?.reset();

  const typeSelect = document.getElementById("device-type");
  const options = type === "sensor" ? SENSOR_TIPOS : ATUADOR_TIPOS;
  typeSelect.innerHTML =
    '<option value="">Selecionar tipo…</option>' +
    options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");

  openModal("device-modal");
}

function bindDeviceForm() {
  document.getElementById("add-sensor")?.addEventListener("click", () => openDeviceModal("sensor"));
  document.getElementById("add-actuator")?.addEventListener("click", () => openDeviceModal("actuator"));

  document.getElementById("device-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("device-name").value.trim();
    const tipo = document.getElementById("device-type").value.trim();
    const localizacao = document.getElementById("device-home").value.trim();

    if (!nome || !tipo || !localizacao) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      if (deviceType === "sensor") {
        await createSensor({ nome, tipo_sensor: tipo, localizacao });
      } else {
        await createAtuador({ nome, tipo_atuador: tipo, localizacao });
      }
      closeModal("device-modal");
      await loadSensorsAndActuators();
    } catch (err) {
      alert(err.message);
    }
  });
}

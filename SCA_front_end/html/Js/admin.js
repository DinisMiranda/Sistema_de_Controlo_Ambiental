// ============================================
// AUTH & INIT
// ============================================

const user = JSON.parse(localStorage.getItem("user"));

const adminMenu = document.getElementById("admin-menu");
if (adminMenu) {
  adminMenu.style.display = user?.admin ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user) return;

  const isAdmin = user?.role?.toLowerCase() === "admin" || user?.admin === true;
  if (!isAdmin) {
    window.location.href = "dashboard.html";
    return;
  }

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

// ============================================
// TAB MANAGEMENT
// ============================================

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.getAttribute("data-tab");

    tabContents.forEach((content) => {
      content.style.display = "none";
      content.classList.remove("active");
    });

    tabButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.style.borderBottomColor = "transparent";
    });

    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
      selectedTab.style.display = "block";
      selectedTab.classList.add("active");
    }

    button.classList.add("active");
    button.style.borderBottomColor = "var(--primary)";
  });
});

const firstTabBtn = document.querySelector(".tab-btn.active");
if (firstTabBtn) {
  firstTabBtn.style.borderBottomColor = "var(--primary)";
}

// ============================================
// USERS
// ============================================

async function loadUsers() {
  const response = await fetchWithAuth("/api/users");
  if (!response.ok) {
    console.error("Erro ao carregar utilizadores");
    return [];
  }
  return response.json();
}

async function createUser(name, email, password) {
  const response = await fetchWithAuth("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ nome: name, email, password }),
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
  const tbody = document.querySelector("#users-table tbody");
  tbody.innerHTML = "";
  users.forEach((u) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>${u.department || "—"}</td>
      <td style="color: ${u.admin ? "var(--accent-orange)" : "var(--text-secondary)"}">
        ${u.admin ? "Admin" : "User"}
      </td>
      <td style="text-align: center;">
        <button class="delete-btn" style="background: none; border: none; color: var(--error); font-size: 1.2rem; cursor: pointer; padding: 0;">✕</button>
      </td>
    `;
    row.querySelector(".delete-btn").addEventListener("click", () => handleDeleteUser(u.id_administrador));
  });
}

async function handleDeleteUser(userId) {
  if (!userId) { alert("Erro: ID do utilizador inválido."); return; }
  if (!confirm("Tem a certeza que quer apagar este utilizador?")) return;
  try {
    await deleteUser(userId);
    populateUsersTable(await loadUsers());
  } catch (err) {
    alert(err.message);
  }
}

// User modal
const userModal = document.getElementById("user-modal");
const userForm = document.getElementById("user-form");

document.getElementById("add-user")?.addEventListener("click", () => {
  userForm.reset();
  userModal.style.display = "flex";
});

document.getElementById("cancel-btn")?.addEventListener("click", () => {
  userModal.style.display = "none";
});

userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name     = document.getElementById("user-name").value.trim();
  const email    = document.getElementById("user-email").value.trim();
  const password = document.getElementById("user-password").value;

  if (!name || !email || !password) { alert("Por favor, preencha todos os campos."); return; }
  if (password.length < 6) { alert("A password deve ter pelo menos 6 caracteres."); return; }

  try {
    await createUser(name, email, password);
    userModal.style.display = "none";
    userForm.reset();
    populateUsersTable(await loadUsers());
  } catch (err) {
    alert(err.message);
  }
});

// ============================================
// SALAS (HOMES)
// Note: /api/salas has no POST/PUT/DELETE — add/edit stay local for the session.
// ============================================

const homesTableBody = document.getElementById("homes-table-body");
const homeModal      = document.getElementById("home-modal");
const homeForm       = document.getElementById("home-form");
const homeModalTitle = document.getElementById("home-modal-title");

let salasCache    = [];
let editingHomeId = null;

async function loadSalas() {
  try {
    const response = await fetchWithAuth("/api/salas");
    if (!response.ok) throw new Error("Erro ao carregar salas");
    const salas = await response.json();
    salasCache = salas.map((s, i) => ({
      id:       s.id || i + 1,
      name:     s.name,
      location: s.location || "—",
      type:     s.badge || "—",
    }));
    renderSalasTable();
  } catch (err) {
    console.error(err);
  }
}

function renderSalasTable() {
  homesTableBody.innerHTML = "";
  salasCache.forEach(addSalaRow);
}

function addSalaRow(sala) {
  const row = homesTableBody.insertRow(-1);
  row.innerHTML = `
    <td>${sala.id}</td>
    <td>${sala.name}</td>
    <td>${sala.location}</td>
    <td>${sala.type}</td>
    <td style="text-align: center;">
      <button class="edit-btn"   style="background:none;border:none;color:var(--primary);font-size:1.2rem;cursor:pointer;padding:0;margin-right:.5rem;">✎</button>
      <button class="delete-btn" style="background:none;border:none;color:var(--error);font-size:1.2rem;cursor:pointer;padding:0;">✕</button>
    </td>
  `;
  row.querySelector(".edit-btn").addEventListener("click", () => openHomeModal(sala.id));
  row.querySelector(".delete-btn").addEventListener("click", () => {
    if (!confirm("Tem a certeza que quer apagar esta sala?")) return;
    salasCache = salasCache.filter((s) => s.id !== sala.id);
    renderSalasTable();
  });
}

function openHomeModal(homeId = null) {
  editingHomeId = homeId;
  if (homeId) {
    const sala = salasCache.find((s) => s.id === homeId);
    if (sala) {
      homeModalTitle.textContent = "Editar Casa";
      document.getElementById("home-name").value     = sala.name;
      document.getElementById("home-location").value = sala.location;
      document.getElementById("home-type").value     = sala.type;
    }
  } else {
    homeModalTitle.textContent = "Adicionar Casa";
    homeForm.reset();
  }
  homeModal.style.display = "flex";
}

document.getElementById("add-home")?.addEventListener("click", () => openHomeModal());

homeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name     = document.getElementById("home-name").value.trim();
  const location = document.getElementById("home-location").value.trim();
  const type     = document.getElementById("home-type").value.trim();

  if (!name || !location || !type) { alert("Por favor, preencha todos os campos."); return; }

  if (editingHomeId) {
    const sala = salasCache.find((s) => s.id === editingHomeId);
    if (sala) { sala.name = name; sala.location = location; sala.type = type; }
  } else {
    const newId = salasCache.length ? Math.max(...salasCache.map((s) => s.id)) + 1 : 1;
    salasCache.push({ id: newId, name, location, type });
  }

  renderSalasTable();
  homeModal.style.display = "none";
  homeForm.reset();
});

document.getElementById("home-cancel-btn")?.addEventListener("click", () => {
  homeModal.style.display = "none";
});
homeModal.addEventListener("click", (e) => { if (e.target === homeModal) homeModal.style.display = "none"; });

// ============================================
// PARAMETERS  →  /api/automatic-parameters
// Fields: id_parametro, nome_parametro, valor_parametro, descricao, atuadores_id_atuador
// ============================================

const parametersTableBody = document.getElementById("parameters-table-body");
const parameterModal      = document.getElementById("parameter-modal");
const parameterForm       = document.getElementById("parameter-form");
const parameterModalTitle = document.getElementById("parameter-modal-title");

let editingParameterId = null;

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
  parametersTableBody.innerHTML = "";
  params.forEach(addParameterRow);
}

function addParameterRow(param) {
  const row = parametersTableBody.insertRow(-1);
  row.innerHTML = `
    <td>${param.id_parametro}</td>
    <td>${param.nome_parametro}</td>
    <td>${param.descricao || "—"}</td>
    <td>${param.valor_parametro}</td>
    <td>${param.atuadores_id_atuador}</td>
    <td style="text-align: center;">
      <button class="edit-btn"   style="background:none;border:none;color:var(--primary);font-size:1.2rem;cursor:pointer;padding:0;margin-right:.5rem;">✎</button>
      <button class="delete-btn" style="background:none;border:none;color:var(--error);font-size:1.2rem;cursor:pointer;padding:0;">✕</button>
    </td>
  `;
  row.querySelector(".edit-btn").addEventListener("click", () => openParameterModal(param.id_parametro, param));
  row.querySelector(".delete-btn").addEventListener("click", async () => {
    if (!confirm("Tem a certeza que quer apagar este parâmetro?")) return;
    // No DELETE endpoint yet — remove from UI only
    row.remove();
  });
}

async function openParameterModal(parameterId = null, param = null) {
  editingParameterId = parameterId;

    if (parameterId && param) {
      parameterModalTitle.textContent = "Editar Parâmetro";
      document.getElementById("parameter-name").value        = param.nome_parametro;
      document.getElementById("parameter-description").value = param.descricao || "";
      document.getElementById("parameter-minValue").value    = param.valor_parametro;
    } else {
      parameterModalTitle.textContent = "Adicionar Parâmetro";
      parameterForm.reset();
    }

    // Populate actuator dropdown
    const select = document.getElementById("parameter-atuador");
    if (select) {
    select.innerHTML = '<option value="">A carregar atuadores...</option>';

    try {
      const atuadores = await loadAtuadores();
      select.innerHTML = '<option value="">Selecionar atuador...</option>';

      atuadores.forEach((a) => {
        const opt = document.createElement("option");
        opt.value = a.id_atuador;
        opt.textContent = `${a.nome} (${a.tipo_atuador || "Atuador"})`;

        if (param && a.id_atuador === param.atuadores_id_atuador) {
          opt.selected = true;
        }

        select.appendChild(opt);
      });
    } catch (err) {
      select.innerHTML = '<option value="">Erro ao carregar atuadores</option>';
    }
  }
  try {
    const atuadores = await loadAtuadores();
    select.innerHTML = '<option value="">Selecionar atuador...</option>';
    atuadores.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.id_atuador;
      opt.textContent = `${a.nome} (${a.tipo_atuador || "Atuador"})`;
      if (param && a.id_atuador === param.atuadores_id_atuador) opt.selected = true;
      select.appendChild(opt);
    });
  } catch {
    select.innerHTML = '<option value="">Erro ao carregar atuadores</option>';
  }

  parameterModal.style.display = "flex";
}

document.getElementById("add-parameter")?.addEventListener("click", () => openParameterModal());

parameterForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome_parametro       = document.getElementById("parameter-name").value.trim();
  const descricao            = document.getElementById("parameter-description").value.trim();
  const valor_parametro      = document.getElementById("parameter-minValue").value.trim();
  const atuadores_id_atuador = document.getElementById("parameter-atuador").value;

  if (!nome_parametro || !valor_parametro) { alert("Por favor, preencha o nome e o valor."); return; }
  if (!atuadores_id_atuador) { alert("Por favor, selecione um atuador."); return; }

  try {
    if (editingParameterId) {
      const response = await fetchWithAuth(`/api/automatic-parameters/${editingParameterId}`, {
        method: "PATCH",
        body: JSON.stringify({ nome_parametro, valor_parametro, descricao, atuadores_id_atuador: Number(atuadores_id_atuador) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao atualizar parâmetro");
      }
    } else {
      const response = await fetchWithAuth("/api/automatic-parameters", {
        method: "POST",
        body: JSON.stringify({ nome_parametro, valor_parametro, descricao, atuadores_id_atuador: Number(atuadores_id_atuador) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao criar parâmetro");
      }
    }

    parameterModal.style.display = "none";
    parameterForm.reset();
    await loadParametros();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("parameter-cancel-btn")?.addEventListener("click", () => {
  parameterModal.style.display = "none";
});
parameterModal.addEventListener("click", (e) => { if (e.target === parameterModal) parameterModal.style.display = "none"; });

// ============================================
// TYPES  →  /api/tipos
// Fields: classe (category), tipo (name), descricao
// Composite PK: classe + tipo
// ============================================

const typesTableBody = document.getElementById("types-table-body");
const typeModal      = document.getElementById("type-modal");
const typeForm       = document.getElementById("type-form");
const typeModalTitle = document.getElementById("type-modal-title");

let editingType = null; // { classe, tipo }

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
  typesTableBody.innerHTML = "";
  tipos.forEach(addTypeRow);
}

function addTypeRow(tipo) {
  const row = typesTableBody.insertRow(-1);
  row.innerHTML = `
    <td>${tipo.classe}</td>
    <td>${tipo.tipo}</td>
    <td>${tipo.descricao}</td>
    <td>${tipo.classe}</td>
    <td style="text-align: center;">
      <button class="edit-btn"   style="background:none;border:none;color:var(--primary);font-size:1.2rem;cursor:pointer;padding:0;margin-right:.5rem;">✎</button>
      <button class="delete-btn" style="background:none;border:none;color:var(--error);font-size:1.2rem;cursor:pointer;padding:0;">✕</button>
    </td>
  `;
  row.querySelector(".edit-btn").addEventListener("click", () => openTypeModal(tipo));
  row.querySelector(".delete-btn").addEventListener("click", async () => {
    if (!confirm("Tem a certeza que quer apagar este tipo?")) return;
    try {
      const response = await fetchWithAuth(
        `/api/tipos/${encodeURIComponent(tipo.classe)}/${encodeURIComponent(tipo.tipo)}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao apagar tipo");
      }
      await loadTipos();
    } catch (err) {
      alert(err.message);
    }
  });
}

function openTypeModal(tipo = null) {
  if (tipo) {
    editingType = { classe: tipo.classe, tipo: tipo.tipo };
    typeModalTitle.textContent = "Editar Tipo";
    document.getElementById("type-name").value        = tipo.tipo;
    document.getElementById("type-description").value = tipo.descricao;
    document.getElementById("type-category").value    = tipo.classe;
  } else {
    editingType = null;
    typeModalTitle.textContent = "Adicionar Tipo";
    typeForm.reset();
  }
  typeModal.style.display = "flex";
}

document.getElementById("add-type").addEventListener("click", () => openTypeModal());

typeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tipo     = document.getElementById("type-name").value.trim();
  const descricao = document.getElementById("type-description").value.trim();
  const classe   = document.getElementById("type-category").value;

  if (!tipo || !descricao || !classe) { alert("Por favor, preencha todos os campos."); return; }

  try {
    if (editingType) {
      const response = await fetchWithAuth(
        `/api/tipos/${encodeURIComponent(editingType.classe)}/${encodeURIComponent(editingType.tipo)}`,
        { method: "PATCH", body: JSON.stringify({ classe, tipo, descricao }) }
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

    typeModal.style.display = "none";
    typeForm.reset();
    await loadTipos();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("type-cancel-btn")?.addEventListener("click", () => {
  typeModal.style.display = "none";
});
typeModal.addEventListener("click", (e) => { if (e.target === typeModal) typeModal.style.display = "none"; });

// ============================================
// SENSORS & ACTUATORS
// ============================================

const deviceModal      = document.getElementById("device-modal");
const deviceForm       = document.getElementById("device-form");
const deviceModalTitle = document.getElementById("device-modal-title");

let deviceType = "sensor";

async function loadSensores() {
  const response = await fetchWithAuth("/api/sensores");
  if (!response.ok) throw new Error("Erro ao carregar sensores");
  return response.json();
}

async function loadAtuadores() {
  const response = await fetchWithAuth("/api/atuadores");
  if (!response.ok) throw new Error("Erro ao carregar atuadores");
  return response.json();
}

async function createSensor(data) {
  const response = await fetchWithAuth("/api/sensores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome:        data.nome,
      tipo_sensor: data.tipo_sensor,
      localizacao: data.localizacao,
      estado:      "ativo",
      Tipos_classe: "Sensor",
      Tipos_tipo:   data.tipo_sensor,
    }),
  });
  const res = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(res.error || "Erro ao criar sensor");
  return res;
}

async function createAtuador(data) {
  const payload = {
    nome: data.nome,
    tipo_atuador: data.tipo_atuador,
    localizacao: data.localizacao,
    estado: true,
    Tipos_classe: "Atuador",
    Tipos_tipo: data.tipo_atuador
  };

  console.log("Sending actuator:", payload);

  const response = await fetchWithAuth("/api/atuadores", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const res = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      res.error || res.message || "Erro ao criar atuador"
    );
  }

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

function createStatusBadge(status) {
  const isActive = status === true || status === "ativo" || status === "Ativo" || status === "active";
  return `<span style="color:${isActive ? "var(--success)" : "var(--error)"};font-weight:bold;">● ${isActive ? "Ativo" : "Inativo"}</span>`;
}

function populateSensorsActuatorsTable(sensores, atuadores) {
  const tbody = document.getElementById("sensors-actuators-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const rows = [
    ...sensores.map((s) => ({ id: s.id_sensor,  kind: "sensor",  nome: s.nome, tipo: s.tipo_sensor  || "Sensor",  localizacao: s.localizacao || "—", estado: s.estado })),
    ...atuadores.map((a) => ({ id: a.id_atuador, kind: "atuador", nome: a.nome, tipo: a.tipo_atuador || "Atuador", localizacao: a.localizacao || "—", estado: a.estado })),
  ];

  rows.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.nome}</td>
      <td>${item.tipo}</td>
      <td>${item.localizacao}</td>
      <td>${createStatusBadge(item.estado)}</td>
      <td style="text-align:center;">
        <button class="delete-btn" style="background:none;border:none;color:var(--error);font-size:1.2rem;cursor:pointer;padding:0;">✕</button>
      </td>
    `;
    row.querySelector(".delete-btn").addEventListener("click", async () => {
      if (!confirm("Tem a certeza que quer apagar este dispositivo?")) return;
      try {
        item.kind === "sensor" ? await deleteSensor(item.id) : await deleteAtuador(item.id);
        await loadSensorsAndActuators();
      } catch (err) {
        alert(err.message);
      }
    });
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

function openDeviceModal(type = "sensor") {
  deviceType = type;
  deviceModalTitle.textContent = type === "sensor" ? "Adicionar Sensor" : "Adicionar Atuador";
  deviceForm.reset();
  deviceModal.style.display = "flex";
}

document.getElementById("add-sensor")?.addEventListener("click",   () => openDeviceModal("sensor"));
document.getElementById("add-actuator")?.addEventListener("click", () => openDeviceModal("actuator"));

document.getElementById("device-cancel-btn")?.addEventListener("click", () => {
  deviceModal.style.display = "none";
});
deviceModal.addEventListener("click", (e) => { if (e.target === deviceModal) deviceModal.style.display = "none"; });

deviceForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome      = document.getElementById("device-name").value.trim();
  const tipo      = document.getElementById("device-type").value.trim();
  const localizacao = document.getElementById("device-home").value.trim();

  if (!nome || !tipo || !localizacao) { alert("Preencha todos os campos."); return; }

  try {
    if (deviceType === "sensor") {
      await createSensor({ nome, tipo_sensor: tipo, localizacao });
    } else {
      await createAtuador({ nome, tipo_atuador: tipo, localizacao });
    }
    deviceModal.style.display = "none";
    await loadSensorsAndActuators();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});
// Define the initial test users (matching auth.js for consistency)
const TEST_USERS = [
  {
    name: "João Silva",
    email: "joao@empresa.com",
    department: "Auditório",
    role: "User",
    password: "joao123",
  },
  {
    name: "Maria Sousa",
    email: "maria@empresa.com",
    department: "Lab A",
    role: "User",
    password: "maria123",
  },
  {
    name: "Administrador",
    email: "admin@edificio.com",
    department: "Administração",
    role: "Admin",
    password: "admin123",
  },
];

// Function to get all users (test + admin-added users)
function getAllUsers() {
  let allUsers = [...TEST_USERS];
  const addedUsers = JSON.parse(localStorage.getItem("addedUsers")) || [];
  allUsers = allUsers.concat(addedUsers);
  return allUsers;
}

// Initialize users array using the shared function
let users = getAllUsers();

// Function to save only added users to localStorage
function saveUsers() {
  const addedUsers = users.filter(
    (user) => !TEST_USERS.some((testUser) => testUser.email === user.email),
  );
  localStorage.setItem("addedUsers", JSON.stringify(addedUsers));
}

// Function to populate table
function populateTable() {
  const table = document.querySelector("table");
  // Clear existing rows except header
  const rows = table.querySelectorAll("tr");
  for (let i = 1; i < rows.length; i++) {
    rows[i].remove();
  }
  // Add users
  users.forEach((user) =>
    addUserToTable(
      user.name,
      user.email,
      user.department,
      user.role,
      user.password,
    ),
  );
}

// Get modal and form elements
const userModal = document.getElementById("user-modal");
const userForm = document.getElementById("user-form");
const addUserBtn = document.getElementById("add-user");
const cancelBtn = document.getElementById("cancel-btn");

// Populate table on load
document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user || user.role !== "Admin") return;
  populateTable();
});

// Open modal when button is clicked
addUserBtn.addEventListener("click", () => {
  userModal.style.display = "flex";
  userForm.reset();
});

// Close modal when cancel button is clicked
cancelBtn.addEventListener("click", () => {
  userModal.style.display = "none";
});

// Close modal when clicking outside the modal content
userModal.addEventListener("click", (e) => {
  if (e.target === userModal) {
    userModal.style.display = "none";
  }
});

// Handle form submission
userForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get form values
  const name = document.getElementById("user-name").value.trim();
  const email = document.getElementById("user-email").value.trim();
  const department = document.getElementById("user-department").value.trim();
  const role = document.getElementById("user-role").value;
  const password = document.getElementById("user-password").value;

  // Validate inputs
  if (!name || !email || !department || !password) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  // Validate password strength
  if (password.length < 6) {
    alert("A password deve ter pelo menos 6 caracteres.");
    return;
  }

  // Check if email already exists
  if (users.some((u) => u.email === email)) {
    alert("Este email já está registado.");
    return;
  }

  // Add new user to users array
  users.push({ name, email, department, role, password });
  saveUsers();

  // Add to table
  addUserToTable(name, email, department, role, password);

  // Close modal and reset form
  userModal.style.display = "none";
  userForm.reset();
});

// Function to add user to table
function addUserToTable(name, email, department, role, password) {
  const table = document.querySelector("table");
  const newRow = table.insertRow(-1);

  const roleColor =
    role === "Admin" ? "var(--accent-orange)" : "var(--text-secondary)";

  newRow.innerHTML = `
    <td>${name}</td>
    <td>${email}</td>
    <td>${department}</td>
    <td style="color: ${roleColor}">${role}</td>
    <td style="text-align: center;"><button class="delete-btn" style="background: none; border: none; color: var(--error); font-size: 1.2rem; cursor: pointer; padding: 0;">✕</button></td>
  `;

  // Store password in data attribute (consider using secure method for production)
  newRow.dataset.password = password;

  // Add delete button event listener
  const deleteBtn = newRow.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => deleteUserWithConfirmation(newRow));
}

// Delete modal elements
const deleteModal = document.getElementById("delete-modal");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
let rowToDelete = null;

// Function to delete user with confirmation
function deleteUserWithConfirmation(row) {
  rowToDelete = row;
  deleteModal.style.display = "flex";
}

// Confirm delete
confirmDeleteBtn.addEventListener("click", () => {
  if (rowToDelete) {
    // Get email from row
    const email = rowToDelete.cells[1].textContent;
    // Remove from users array
    users = users.filter((u) => u.email !== email);
    saveUsers();
    // Remove row
    rowToDelete.remove();
    deleteModal.style.display = "none";
    rowToDelete = null;
  }
});

// Cancel delete
cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.style.display = "none";
  rowToDelete = null;
});

// Close delete modal when clicking outside
deleteModal.addEventListener("click", (e) => {
  if (e.target === deleteModal) {
    deleteModal.style.display = "none";
    rowToDelete = null;
  }
});

// Add delete button event listeners to existing rows
document.querySelectorAll(".delete-btn").forEach((btn) => {
  btn.addEventListener("click", () =>
    deleteUserWithConfirmation(btn.closest("tr")),
  );
});

// Color existing rows based on role
document.querySelectorAll("table tr:not(:first-child)").forEach((row) => {
  const roleCell = row.cells[3];
  if (roleCell) {
    const role = roleCell.textContent.trim();
    roleCell.style.color =
      role === "Admin" ? "var(--accent-orange)" : "var(--text-secondary)";
  }
});

// ============================================
// TAB MANAGEMENT
// ============================================

// Get all tab buttons and contents
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Add click event listeners to tab buttons
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.getAttribute("data-tab");

    // Hide all tab contents
    tabContents.forEach((content) => {
      content.style.display = "none";
      content.classList.remove("active");
    });

    // Remove active class from all buttons
    tabButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.style.borderBottomColor = "transparent";
    });

    // Show selected tab content
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
      selectedTab.style.display = "block";
      selectedTab.classList.add("active");
    }

    // Add active style to clicked button
    button.classList.add("active");
    button.style.borderBottomColor = "var(--primary)";
  });
});

// Set initial active tab button style
const firstTabBtn = document.querySelector(".tab-btn.active");
if (firstTabBtn) {
  firstTabBtn.style.borderBottomColor = "var(--primary)";
}

// ============================================
// MODAL FUNCTIONS
// ============================================

// Home Modal
const homeModal = document.getElementById("home-modal");
const homeForm = document.getElementById("home-form");
const homeModalTitle = document.getElementById("home-modal-title");
const homeCancelBtn = document.getElementById("home-cancel-btn");
let editingHomeId = null;

function openHomeModal(homeId = null) {
  editingHomeId = homeId;
  if (homeId) {
    const home = homes.find((h) => h.id === homeId);
    if (home) {
      homeModalTitle.textContent = "Editar Casa";
      document.getElementById("home-name").value = home.name;
      document.getElementById("home-location").value = home.location;
      document.getElementById("home-type").value = home.type;
    }
  } else {
    homeModalTitle.textContent = "Adicionar Casa";
    homeForm.reset();
  }
  homeModal.style.display = "flex";
}

homeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("home-name").value.trim();
  const location = document.getElementById("home-location").value.trim();
  const type = document.getElementById("home-type").value.trim();

  if (!name || !location || !type) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  if (editingHomeId) {
    const home = homes.find((h) => h.id === editingHomeId);
    if (home) {
      home.name = name;
      home.location = location;
      home.type = type;
      updateHomeRow(editingHomeId);
    }
  } else {
    const newHome = {
      id: Math.max(...homes.map((h) => h.id), 0) + 1,
      name,
      location,
      type,
    };
    homes.push(newHome);
    addHomeRow(newHome);
  }

  homeModal.style.display = "none";
  homeForm.reset();
});

homeCancelBtn.addEventListener("click", () => {
  homeModal.style.display = "none";
});

homeModal.addEventListener("click", (e) => {
  if (e.target === homeModal) {
    homeModal.style.display = "none";
  }
});

// Device Modal
const deviceModal = document.getElementById("device-modal");
const deviceForm = document.getElementById("device-form");
const deviceModalTitle = document.getElementById("device-modal-title");
const deviceCancelBtn = document.getElementById("device-cancel-btn");
let editingDeviceId = null;
let deviceType = "sensor"; // sensor or actuator

function openDeviceModal(deviceId = null, type = "sensor") {
  editingDeviceId = deviceId;
  deviceType = type;
  if (deviceId) {
    const device = devices.find((d) => d.id === deviceId);
    if (device) {
      deviceModalTitle.textContent =
        "Editar " + (type === "sensor" ? "Sensor" : "Atuador");
      document.getElementById("device-name").value = device.name;
      document.getElementById("device-type").value = device.type;
      document.getElementById("device-home").value = device.home;
    }
  } else {
    deviceModalTitle.textContent =
      "Adicionar " + (type === "sensor" ? "Sensor" : "Atuador");
    deviceForm.reset();
  }
  deviceModal.style.display = "flex";
}

deviceForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("device-name").value.trim();
  const type = document.getElementById("device-type").value.trim();
  const home = document.getElementById("device-home").value.trim();

  if (!name || !type || !home) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  if (editingDeviceId) {
    const device = devices.find((d) => d.id === editingDeviceId);
    if (device) {
      device.name = name;
      device.type = type;
      device.home = home;
      updateDeviceRow(editingDeviceId);
    }
  } else {
    const prefix = deviceType === "sensor" ? "S" : "A";
    const newDevice = {
      id:
        prefix +
        String(
          Math.max(
            ...devices
              .filter((d) => d.id.startsWith(prefix))
              .map((d) => parseInt(d.id.substring(1))),
            0,
          ) + 1,
        ).padStart(3, "0"),
      name,
      type,
      home,
      status: "Ativo",
    };
    devices.push(newDevice);
    addDeviceRow(newDevice);
  }

  deviceModal.style.display = "none";
  deviceForm.reset();
});

deviceCancelBtn.addEventListener("click", () => {
  deviceModal.style.display = "none";
});

deviceModal.addEventListener("click", (e) => {
  if (e.target === deviceModal) {
    deviceModal.style.display = "none";
  }
});

// Parameter Modal
const parameterModal = document.getElementById("parameter-modal");
const parameterForm = document.getElementById("parameter-form");
const parameterModalTitle = document.getElementById("parameter-modal-title");
const parameterCancelBtn = document.getElementById("parameter-cancel-btn");
let editingParameterId = null;

function openParameterModal(parameterId = null) {
  editingParameterId = parameterId;
  if (parameterId) {
    const param = parameters.find((p) => p.id === parameterId);
    if (param) {
      parameterModalTitle.textContent = "Editar Parâmetro";
      document.getElementById("parameter-name").value = param.name;
      document.getElementById("parameter-description").value =
        param.description;
      document.getElementById("parameter-minValue").value = param.minValue;
      document.getElementById("parameter-maxValue").value = param.maxValue;
    }
  } else {
    parameterModalTitle.textContent = "Adicionar Parâmetro";
    parameterForm.reset();
  }
  parameterModal.style.display = "flex";
}

parameterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("parameter-name").value.trim();
  const description = document
    .getElementById("parameter-description")
    .value.trim();
  const minValue = document.getElementById("parameter-minValue").value.trim();
  const maxValue = document.getElementById("parameter-maxValue").value.trim();

  if (!name || !description || !minValue || !maxValue) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  if (editingParameterId) {
    const param = parameters.find((p) => p.id === editingParameterId);
    if (param) {
      param.name = name;
      param.description = description;
      param.minValue = minValue;
      param.maxValue = maxValue;
      updateParameterRow(editingParameterId);
    }
  } else {
    const newParam = {
      id: Math.max(...parameters.map((p) => p.id), 0) + 1,
      name,
      description,
      minValue,
      maxValue,
    };
    parameters.push(newParam);
    addParameterRow(newParam);
  }

  parameterModal.style.display = "none";
  parameterForm.reset();
});

parameterCancelBtn.addEventListener("click", () => {
  parameterModal.style.display = "none";
});

parameterModal.addEventListener("click", (e) => {
  if (e.target === parameterModal) {
    parameterModal.style.display = "none";
  }
});

// Type Modal
const typeModal = document.getElementById("type-modal");
const typeForm = document.getElementById("type-form");
const typeModalTitle = document.getElementById("type-modal-title");
const typeCancelBtn = document.getElementById("type-cancel-btn");
let editingTypeId = null;

function openTypeModal(typeId = null) {
  editingTypeId = typeId;
  if (typeId) {
    const type = types.find((t) => t.id === typeId);
    if (type) {
      typeModalTitle.textContent = "Editar Tipo";
      document.getElementById("type-name").value = type.name;
      document.getElementById("type-description").value = type.description;
      document.getElementById("type-category").value = type.category;
    }
  } else {
    typeModalTitle.textContent = "Adicionar Tipo";
    typeForm.reset();
  }
  typeModal.style.display = "flex";
}

typeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("type-name").value.trim();
  const description = document.getElementById("type-description").value.trim();
  const category = document.getElementById("type-category").value;

  if (!name || !description || !category) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  if (editingTypeId) {
    const type = types.find((t) => t.id === editingTypeId);
    if (type) {
      type.name = name;
      type.description = description;
      type.category = category;
      updateTypeRow(editingTypeId);
    }
  } else {
    const newType = {
      id: Math.max(...types.map((t) => t.id), 0) + 1,
      name,
      description,
      category,
    };
    types.push(newType);
    addTypeRow(newType);
  }

  typeModal.style.display = "none";
  typeForm.reset();
});

typeCancelBtn.addEventListener("click", () => {
  typeModal.style.display = "none";
});

typeModal.addEventListener("click", (e) => {
  if (e.target === typeModal) {
    typeModal.style.display = "none";
  }
});

// ============================================
// HOMES MANAGEMENT
// ============================================

const homesTable = document.querySelector("#tab-homes table");
let homes = [
  {
    id: 1,
    name: "Auditório",
    location: "Andar 1",
    type: "Sala de Conferências",
  },
  { id: 2, name: "Laboratório A", location: "Andar 2", type: "Laboratório" },
];

document.getElementById("add-home")?.addEventListener("click", () => {
  openHomeModal();
});

function addHomeRow(home) {
  const newRow = homesTable.insertRow(-1);
  newRow.innerHTML = `
    <td>${home.id}</td>
    <td>${home.name}</td>
    <td>${home.location}</td>
    <td>${home.type}</td>
    <td style="text-align: center;">
      <button class="edit-btn" style="background: none; border: none; color: var(--primary); font-size: 1.2rem; cursor: pointer; padding: 0; margin-right: 0.5rem;">✎</button>
      <button class="delete-btn" style="background: none; border: none; color: var(--error); font-size: 1.2rem; cursor: pointer; padding: 0;">✕</button>
    </td>
  `;

  const deleteBtn = newRow.querySelector(".delete-btn");
  const editBtn = newRow.querySelector(".edit-btn");

  deleteBtn.addEventListener("click", () => {
    homes = homes.filter((h) => h.id !== home.id);
    newRow.remove();
  });

  editBtn.addEventListener("click", () => {
    openHomeModal(home.id);
  });
}

function updateHomeRow(homeId) {
  const rows = homesTable.querySelectorAll("tr");
  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i].cells[0].textContent) === homeId) {
      const home = homes.find((h) => h.id === homeId);
      rows[i].cells[1].textContent = home.name;
      rows[i].cells[2].textContent = home.location;
      rows[i].cells[3].textContent = home.type;
      break;
    }
  }
}

// ============================================
// SENSORS & ACTUATORS MANAGEMENT
// ============================================

const sensorsTable = document.querySelector("#tab-sensors-actuators table");
let devices = [
  {
    id: "S001",
    name: "Sensor Temperatura 1",
    type: "Temperatura",
    home: "Auditório",
    status: "Ativo",
  },
  {
    id: "A001",
    name: "Ar Condicionado 1",
    type: "Atuador",
    home: "Auditório",
    status: "Ativo",
  },
];

document.getElementById("add-sensor")?.addEventListener("click", () => {
  openDeviceModal(null, "sensor");
});

document.getElementById("add-actuator")?.addEventListener("click", () => {
  openDeviceModal(null, "actuator");
});

function addDeviceRow(device) {
  const newRow = sensorsTable.insertRow(-1);
  const statusColor =
    device.status === "Ativo" ? "var(--success)" : "var(--error)";

  newRow.innerHTML = `
    <td>${device.id}</td>
    <td>${device.name}</td>
    <td>${device.type}</td>
    <td>${device.home}</td>
    <td><span style="color: ${statusColor}; font-weight: bold;">● ${device.status}</span></td>
    <td style="text-align: center;">
      <button class="edit-btn" style="background: none; border: none; color: var(--primary); font-size: 1.2rem; cursor: pointer; padding: 0; margin-right: 0.5rem;">✎</button>
      <button class="delete-btn" style="background: none; border: none; color: var(--error); font-size: 1.2rem; cursor: pointer; padding: 0;">✕</button>
    </td>
  `;

  const deleteBtn = newRow.querySelector(".delete-btn");
  const editBtn = newRow.querySelector(".edit-btn");

  deleteBtn.addEventListener("click", () => {
    devices = devices.filter((d) => d.id !== device.id);
    newRow.remove();
  });

  editBtn.addEventListener("click", () => {
    const type = device.id.startsWith("S") ? "sensor" : "actuator";
    openDeviceModal(device.id, type);
  });
}

function updateDeviceRow(deviceId) {
  const rows = sensorsTable.querySelectorAll("tr");
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].cells[0].textContent === deviceId) {
      const device = devices.find((d) => d.id === deviceId);
      rows[i].cells[1].textContent = device.name;
      rows[i].cells[2].textContent = device.type;
      rows[i].cells[3].textContent = device.home;
      break;
    }
  }
}

// ============================================
// PARAMETERS MANAGEMENT
// ============================================

const parametersTable = document.querySelector("#tab-parameters table");
let parameters = [
  {
    id: 1,
    name: "Temperatura Ideal",
    description: "Temperatura recomendada para conforto",
    minValue: "18°C",
    maxValue: "24°C",
  },
  {
    id: 2,
    name: "Humidade Ideal",
    description: "Umidade recomendada para ambiente",
    minValue: "40%",
    maxValue: "60%",
  },
];

document.getElementById("add-parameter")?.addEventListener("click", () => {
  openParameterModal();
});

function addParameterRow(param) {
  const newRow = parametersTable.insertRow(-1);
  newRow.innerHTML = `
    <td>${param.id}</td>
    <td>${param.name}</td>
    <td>${param.description}</td>
    <td>${param.minValue}</td>
    <td>${param.maxValue}</td>
    <td style="text-align: center;">
      <button class="edit-btn" style="background: none; border: none; color: var(--primary); font-size: 1.2rem; cursor: pointer; padding: 0; margin-right: 0.5rem;">✎</button>
      <button class="delete-btn" style="background: none; border: none; color: var(--error); font-size: 1.2rem; cursor: pointer; padding: 0;">✕</button>
    </td>
  `;

  const deleteBtn = newRow.querySelector(".delete-btn");
  const editBtn = newRow.querySelector(".edit-btn");

  deleteBtn.addEventListener("click", () => {
    parameters = parameters.filter((p) => p.id !== param.id);
    newRow.remove();
  });

  editBtn.addEventListener("click", () => {
    openParameterModal(param.id);
  });
}

function updateParameterRow(parameterId) {
  const rows = parametersTable.querySelectorAll("tr");
  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i].cells[0].textContent) === parameterId) {
      const param = parameters.find((p) => p.id === parameterId);
      rows[i].cells[1].textContent = param.name;
      rows[i].cells[2].textContent = param.description;
      rows[i].cells[3].textContent = param.minValue;
      rows[i].cells[4].textContent = param.maxValue;
      break;
    }
  }
}

// ============================================
// TYPES MANAGEMENT
// ============================================

const typesTable = document.querySelector("#tab-types table");
let types = [
  {
    id: 1,
    name: "Temperatura",
    description: "Sensor de temperatura ambiente",
    category: "Sensor",
  },
  {
    id: 2,
    name: "Umidade",
    description: "Sensor de umidade do ar",
    category: "Sensor",
  },
];

document.getElementById("add-type")?.addEventListener("click", () => {
  openTypeModal();
});

function addTypeRow(type) {
  const newRow = typesTable.insertRow(-1);
  newRow.innerHTML = `
    <td>${type.id}</td>
    <td>${type.name}</td>
    <td>${type.description}</td>
    <td>${type.category}</td>
    <td style="text-align: center;">
      <button class="edit-btn" style="background: none; border: none; color: var(--primary); font-size: 1.2rem; cursor: pointer; padding: 0; margin-right: 0.5rem;">✎</button>
      <button class="delete-btn" style="background: none; border: none; color: var(--error); font-size: 1.2rem; cursor: pointer; padding: 0;">✕</button>
    </td>
  `;

  const deleteBtn = newRow.querySelector(".delete-btn");
  const editBtn = newRow.querySelector(".edit-btn");

  deleteBtn.addEventListener("click", () => {
    types = types.filter((t) => t.id !== type.id);
    newRow.remove();
  });

  editBtn.addEventListener("click", () => {
    openTypeModal(type.id);
  });
}

function updateTypeRow(typeId) {
  const rows = typesTable.querySelectorAll("tr");
  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i].cells[0].textContent) === typeId) {
      const type = types.find((t) => t.id === typeId);
      rows[i].cells[1].textContent = type.name;
      rows[i].cells[2].textContent = type.description;
      rows[i].cells[3].textContent = type.category;
      break;
    }
  }
}

// ============================================
// ATTACH EDIT/DELETE TO INITIAL ROWS
// ============================================

// Homes initial rows
const homesInitialRows = document.querySelectorAll(
  "#tab-homes table tbody tr, #tab-homes table tr:not(:first-child)",
);
homesInitialRows.forEach((row) => {
  const editBtn = row.querySelector(".edit-btn");
  const deleteBtn = row.querySelector(".delete-btn");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const id = parseInt(row.cells[0].textContent);
      openHomeModal(id);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const id = parseInt(row.cells[0].textContent);
      homes = homes.filter((h) => h.id !== id);
      row.remove();
    });
  }
});

// Sensors/Actuators initial rows
const devicesInitialRows = document.querySelectorAll(
  "#tab-sensors-actuators table tbody tr, #tab-sensors-actuators table tr:not(:first-child)",
);
devicesInitialRows.forEach((row) => {
  const editBtn = row.querySelector(".edit-btn");
  const deleteBtn = row.querySelector(".delete-btn");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const id = row.cells[0].textContent;
      const device = devices.find((d) => d.id === id);
      if (device) {
        const type = device.id.startsWith("S") ? "sensor" : "actuator";
        openDeviceModal(id, type);
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const id = row.cells[0].textContent;
      devices = devices.filter((d) => d.id !== id);
      row.remove();
    });
  }
});

// Parameters initial rows
const parametersInitialRows = document.querySelectorAll(
  "#tab-parameters table tbody tr, #tab-parameters table tr:not(:first-child)",
);
parametersInitialRows.forEach((row) => {
  const editBtn = row.querySelector(".edit-btn");
  const deleteBtn = row.querySelector(".delete-btn");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const id = parseInt(row.cells[0].textContent);
      openParameterModal(id);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const id = parseInt(row.cells[0].textContent);
      parameters = parameters.filter((p) => p.id !== id);
      row.remove();
    });
  }
});

// Types initial rows
const typesInitialRows = document.querySelectorAll(
  "#tab-types table tbody tr, #tab-types table tr:not(:first-child)",
);
typesInitialRows.forEach((row) => {
  const editBtn = row.querySelector(".edit-btn");
  const deleteBtn = row.querySelector(".delete-btn");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const id = parseInt(row.cells[0].textContent);
      openTypeModal(id);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const id = parseInt(row.cells[0].textContent);
      types = types.filter((t) => t.id !== id);
      row.remove();
    });
  }
});

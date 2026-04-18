const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.role !== "Admin") {
  location.href = "login.html";
}

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
populateTable();

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

  // Optional: Send to backend API
  // sendUserToBackend({ name, email, department, role, password });
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

// Optional: Function to send user data to backend
/*
function sendUserToBackend(userData) {
  fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  })
  .then(response => response.json())
  .then(data => {
    console.log("User added successfully:", data);
  })
  .catch(error => {
    console.error("Error adding user:", error);
    alert("Erro ao adicionar utilizador.");
  });
}
*/

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
  const name = prompt("Nome da casa:");
  if (!name) return;

  const location = prompt("Localização:");
  if (!location) return;

  const type = prompt("Tipo:");
  if (!type) return;

  const newHome = {
    id: Math.max(...homes.map((h) => h.id), 0) + 1,
    name,
    location,
    type,
  };

  homes.push(newHome);
  addHomeRow(newHome);
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
    const newName = prompt("Novo nome:", home.name);
    if (newName) home.name = newName;

    const newLocation = prompt("Nova localização:", home.location);
    if (newLocation) home.location = newLocation;

    const newType = prompt("Novo tipo:", home.type);
    if (newType) home.type = newType;

    newRow.cells[1].textContent = home.name;
    newRow.cells[2].textContent = home.location;
    newRow.cells[3].textContent = home.type;
  });
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
  const name = prompt("Nome do sensor:");
  if (!name) return;

  const type = prompt("Tipo (ex: Temperatura, Umidade, Luminosidade):");
  if (!type) return;

  const home = prompt("Casa/Localização:");
  if (!home) return;

  const newDevice = {
    id:
      "S" +
      String(
        Math.max(
          ...devices
            .filter((d) => d.id.startsWith("S"))
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
});

document.getElementById("add-actuator")?.addEventListener("click", () => {
  const name = prompt("Nome do atuador:");
  if (!name) return;

  const type = prompt("Tipo (ex: Ar Condicionado, Luz, Bomba):");
  if (!type) return;

  const home = prompt("Casa/Localização:");
  if (!home) return;

  const newDevice = {
    id:
      "A" +
      String(
        Math.max(
          ...devices
            .filter((d) => d.id.startsWith("A"))
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
    const newName = prompt("Novo nome:", device.name);
    if (newName) device.name = newName;

    const newType = prompt("Novo tipo:", device.type);
    if (newType) device.type = newType;

    const newHome = prompt("Nova localização:", device.home);
    if (newHome) device.home = newHome;

    newRow.cells[1].textContent = device.name;
    newRow.cells[2].textContent = device.type;
    newRow.cells[3].textContent = device.home;
  });
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
  const name = prompt("Nome do parâmetro:");
  if (!name) return;

  const description = prompt("Descrição:");
  if (!description) return;

  const minValue = prompt("Valor mínimo:");
  if (!minValue) return;

  const maxValue = prompt("Valor máximo:");
  if (!maxValue) return;

  const newParam = {
    id: Math.max(...parameters.map((p) => p.id), 0) + 1,
    name,
    description,
    minValue,
    maxValue,
  };

  parameters.push(newParam);
  addParameterRow(newParam);
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
    const newName = prompt("Novo nome:", param.name);
    if (newName) param.name = newName;

    const newDesc = prompt("Nova descrição:", param.description);
    if (newDesc) param.description = newDesc;

    const newMin = prompt("Novo valor mínimo:", param.minValue);
    if (newMin) param.minValue = newMin;

    const newMax = prompt("Novo valor máximo:", param.maxValue);
    if (newMax) param.maxValue = newMax;

    newRow.cells[1].textContent = param.name;
    newRow.cells[2].textContent = param.description;
    newRow.cells[3].textContent = param.minValue;
    newRow.cells[4].textContent = param.maxValue;
  });
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
  const name = prompt("Nome do tipo:");
  if (!name) return;

  const description = prompt("Descrição:");
  if (!description) return;

  const category = prompt("Categoria (Sensor/Atuador):");
  if (!category) return;

  const newType = {
    id: Math.max(...types.map((t) => t.id), 0) + 1,
    name,
    description,
    category,
  };

  types.push(newType);
  addTypeRow(newType);
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
    const newName = prompt("Novo nome:", type.name);
    if (newName) type.name = newName;

    const newDesc = prompt("Nova descrição:", type.description);
    if (newDesc) type.description = newDesc;

    const newCat = prompt("Nova categoria:", type.category);
    if (newCat) type.category = newCat;

    newRow.cells[1].textContent = type.name;
    newRow.cells[2].textContent = type.description;
    newRow.cells[3].textContent = type.category;
  });
}

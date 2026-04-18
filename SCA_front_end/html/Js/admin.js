const user = JSON.parse(localStorage.getItem("user"));
if (
  !user ||
  user.role !== "Admin"
) {
  location.href = "login.html";
}

// Define the initial test users (matching auth.js for consistency)
const TEST_USERS = [
  { name: "João Silva", email: "joao@empresa.com", department: "Auditório", role: "User", password: "joao123" },
  { name: "Maria Sousa", email: "maria@empresa.com", department: "Lab A", role: "User", password: "maria123" },
  { name: "Administrador", email: "admin@edificio.com", department: "Administração", role: "Admin", password: "admin123" }
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
  const addedUsers = users.filter(user => !TEST_USERS.some(testUser => testUser.email === user.email));
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
  users.forEach(user => addUserToTable(user.name, user.email, user.department, user.role, user.password));
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
  if (users.some(u => u.email === email)) {
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

  const roleColor = role === "Admin" ? "var(--accent-orange)" : "var(--text-secondary)";

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
    users = users.filter(u => u.email !== email);
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
  btn.addEventListener("click", () => deleteUserWithConfirmation(btn.closest("tr")));
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
    roleCell.style.color = role === "Admin" ? "var(--accent-orange)" : "var(--text-secondary)";
  }
});

/* ================================
   UTILIZADORES DE TESTE
================================ */
const TEST_USERS = [
  {
    email: "admin@edificio.com",
    password: "admin123",
    name: "Administrador",
    role: "Admin",
  },
  {
    email: "joao@empresa.com",
    password: "joao123",
    name: "João Silva",
    role: "User",
  },
  {
    email: "maria@empresa.com",
    password: "maria123",
    name: "Maria Sousa",
    role: "User",
  },
  {    
    email: "admin@edificio.com",
    password: "admin123",
    name: "Administrador",
    role: "Admin",
  }
];

// Function to get all users (test + admin-added users)
function getAllUsers() {
  let allUsers = [...TEST_USERS];
  
  // Get users added from admin panel
  const addedUsers = JSON.parse(localStorage.getItem("addedUsers")) || [];
  
  // Merge with test users
  allUsers = allUsers.concat(addedUsers);
  
  return allUsers;
}

// Garante que o código só corre após o DOM carregar
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorMsg = document.getElementById("login-error");

  if (!form) return; // evita erro se o script também for incluído em outras páginas

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    errorMsg.classList.add("hidden");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Get all users (including ones added in admin panel)
    const allUsers = getAllUsers();
    
    const found = allUsers.find(
      (u) => u.email === email && u.password === password,
    );

    if (!found) {
      showError("Email ou senha incorretos.");
      return;
    }

    localStorage.setItem("user", JSON.stringify(found));

    if (found.role === "login") window.location.href = "login.html";
    else window.location.href = "dashboard.html";
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }

  // Redireciona apenas se estivermos na página de login
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && window.location.pathname.includes("login.html")) {
    if (user.role === "login") window.location.href = "login.html";
    else window.location.href = "dashboard.html";
  }
});

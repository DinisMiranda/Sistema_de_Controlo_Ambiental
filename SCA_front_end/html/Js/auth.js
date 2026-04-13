/* ================================
   UTILIZADORES DE TESTE
================================ */
const TEST_USERS = [
  { email: "admin@edificio.com", password: "admin123", name: "Administrador", role: "admin" },
  { email: "joao@empresa.com", password: "joao123", name: "João Silva", role: "user" },
  { email: "maria@empresa.com", password: "maria123", name: "Maria Sousa", role: "user" },
];

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

    const found = TEST_USERS.find((u) => u.email === email && u.password === password);

    if (!found) {
      showError("Email ou senha incorretos.");
      return;
    }

    localStorage.setItem("user", JSON.stringify(found));

    if (found.role === "admin") window.location.href = "admin.html";
    else window.location.href = "dashboard.html";
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }

  // Redireciona apenas se estivermos na página de login
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && window.location.pathname.includes("login.html")) {
    if (user.role === "admin") window.location.href = "admin.html";
    else window.location.href = "dashboard.html";
  }
});

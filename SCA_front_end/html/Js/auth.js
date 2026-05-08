document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorMsg = document.getElementById("login-error");

  if (!form) return;

  // Se já existir token, manda para o dashboard
  const token = localStorage.getItem("token");
  if (token && window.location.pathname.includes("login.html")) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    hideError();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      showError("Preenche o email e a senha.");
      return;
    }

    // IMPORTANTE:
    // Quando souberes a URL do backend, só precisas trocar esta linha
    const API_BASE_URL = "http://localhost:3000";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.message || "Email ou senha incorretos.");
        return;
      }

      // Guarda token
      localStorage.setItem("token", data.token);

      // Guarda utilizador, se vier na resposta
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Erro ao ligar ao backend:", error);
      showError("Não foi possível ligar ao servidor.");
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }

  function hideError() {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
  }
});
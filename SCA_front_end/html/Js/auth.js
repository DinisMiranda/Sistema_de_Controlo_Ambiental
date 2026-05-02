document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorMsg = document.getElementById("login-error");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      errorMsg.classList.add("hidden");

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const result = await loginRequest(email, password);
        setSession(result.user, result.token);
        window.location.href = "dashboard.html";
      } catch (error) {
        showError(error.message || "Email ou senha incorretos.");
      }
    });
  }

  if (errorMsg && window.location.pathname.includes("login.html")) {
    redirectIfAuthenticated();
  }

  function showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }
});

const API_BASE = "http://localhost:3001";

const TEST_USERS = [
  {
    id: 1,
    email: "admin@edificio.com",
    password: "admin123",
    name: "Administrador",
    role: "Admin",
  },
  {
    id: 2,
    email: "joao@empresa.com",
    password: "joao123",
    name: "João Silva",
    role: "User",
  },
  {
    id: 3,
    email: "maria@empresa.com",
    password: "maria123",
    name: "Maria Sousa",
    role: "User",
  },
];

function normalizeUser(user = {}) {
  return {
    ...user,
    name: user.name || user.nome || user.Nome || "",
    role: user.role || (user.admin ? "Admin" : "User"),
    admin: Boolean(user.admin),
  };
}

function setSession(user, token) {
  const normalizedUser = normalizeUser(user);
  localStorage.setItem("user", JSON.stringify(normalizedUser));
  localStorage.setItem("token", token);
}

function clearSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

async function validateSession() {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await response.json();
    if (!data?.user) {
      clearSession();
      return null;
    }

    setSession(data.user, token);
    return getCurrentUser();
  } catch {
    clearSession();
    return null;
  }
}

async function requireAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return null;
  }

  try {
    const response = await fetchWithAuth("/api/auth/me");

    if (!response.ok) {
      throw new Error("Token inválido");
    }

    const data = await response.json();

    if (!data.user) {
      throw new Error("Sessão inválida");
    }

    setSession(data.user, token);

    return data.user;
  } catch {
    clearSession();
    window.location.href = "login.html";
    return null;
  }
}

async function redirectIfAuthenticated() {
  const user = await validateSession();
  if (user) {
    window.location.href = "dashboard.html";
  }
}

async function loginRequest(email, password) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      throw new Error("Resposta inválida do servidor");
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || "Erro no login");
    }

    if (!data.token || !data.user) {
      throw new Error("Dados de autenticação inválidos");
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Não foi possível ligar ao servidor");
    }

    throw error;
  }
}

async function fetchWithAuth(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearSession();

      if (!window.location.pathname.endsWith("login.html")) {
        window.location.href = "login.html";
      }
    }

    return response;
  } catch {
    throw new Error("Erro de ligação ao servidor");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const data = await loginRequest(email, password);

      setSession(data.user, data.token);

      window.location.href = "dashboard.html";
    } catch (err) {
      const errorBox = document.getElementById("login-error");

      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
    }
  });
});
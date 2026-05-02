const API_BASE = "http://localhost:3001";

function normalizeUser(user) {
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
  return raw ? JSON.parse(raw) : null;
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
    if (data?.user) {
      setSession(data.user, token);
      return getCurrentUser();
    }

    clearSession();
    return null;
  } catch {
    clearSession();
    return null;
  }
}

async function requireAuth() {
  const user = await validateSession();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

async function redirectIfAuthenticated() {
  const user = await validateSession();
  if (user) {
    window.location.href = "dashboard.html";
  }
}

async function loginRequest(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || "Falha na autenticação");
  }

  return response.json();
}

async function fetchWithAuth(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

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
}

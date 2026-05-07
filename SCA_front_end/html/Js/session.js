const API_BASE = "http://localhost:3001";

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
      headers: { Authorization: `Bearer ${token}` },
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

async function loginRequest(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Falha na autenticação");
  }

  return data;
}

async function registerDepartmentRequest(name) {
  const token = getToken();
  if (!token) throw new Error("Usuário não autenticado");

  const response = await fetch(`${API_BASE}/api/departments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Falha ao registrar departamento");
  }

  return data;
}

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";

    throw new Error("Sessão expirada");
  }

  return response;
}

async function getSensorReadings(sensorId) {
  let response = await fetchWithAuth(`/api/sensores/${sensorId}/readings`);

  if (!response.ok) {
    response = await fetchWithAuth(`/api/sensores/${sensorId}/readings`);
  }

  if (!response.ok) {
    return [];
  }

  return response.json();
}

async function loadDashboardData() {
  try {
    const response = await fetchWithAuth("/api/sensores");

    if (!response.ok) {
      throw new Error("Erro ao carregar dashboard");
    }

    const sensors = await response.json();

    updateDashboard(sensors);
  } catch (error) {
    console.error(error);
  }
}

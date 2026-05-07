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
    window.location.href = "SCA_front_end\\html\\dashboard.html";
  }
}

function loginRequest(email, password) {
  const demoUser = DEMO_USERS.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password,
  );

  if (demoUser) {
    return Promise.resolve({
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        admin: demoUser.admin,
        role: demoUser.role,
      },
      token: `demo-token-${demoUser.id}`,
    });
  }

  return fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Falha na autenticação");
    }

    return data;
  });
}

async function fetchWithAuth(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
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

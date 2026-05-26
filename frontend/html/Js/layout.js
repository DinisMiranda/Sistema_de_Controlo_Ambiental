function getUserDisplayName(user) {
  if (!user) return "—";
  return user.name || user.nome || user.email || "Utilizador";
}

function getUserRole(user) {
  if (!user) return "—";
  if (user.role) return String(user.role).toLowerCase();
  return user.admin ? "admin" : "utilizador";
}

function setUserInitials(name) {
  const el = document.getElementById("user-initials");
  if (!el || !name) return;
  const parts = String(name).trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.slice(0, 2);
  el.textContent = initials.toUpperCase();
}

function setupShell(activeNav) {
  document.querySelectorAll(".nav-item[data-nav]").forEach((el) => {
    el.classList.toggle("active", el.dataset.nav === activeNav);
  });

  const userRaw = localStorage.getItem("user");
  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  const name = getUserDisplayName(user);
  const role = getUserRole(user);

  const nameEl = document.getElementById("user-name");
  const roleEl = document.getElementById("user-role");
  const infoEl = document.getElementById("user-info");

  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role;
  if (infoEl) infoEl.textContent = `👤 ${name}`;
  setUserInitials(name);

  const adminLink = document.querySelector(".nav-item.admin-link");
  if (adminLink) {
    const isAdmin = role === "admin";
    adminLink.style.display = isAdmin ? "" : "none";
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn && !logoutBtn.dataset.bound) {
    logoutBtn.dataset.bound = "1";
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }
}

function tickTimestamp() {
  const el = document.getElementById("timestamp");
  if (!el) return;
  el.textContent = new Intl.DateTimeFormat("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date())
    .toUpperCase();
}

function startTimestampClock() {
  tickTimestamp();
  setInterval(tickTimestamp, 30000);
}

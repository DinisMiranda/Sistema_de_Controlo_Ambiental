const SENSOR_ICONS = {
  temperatura: { cls: "temp", icon: "ti-temperature" },
  humidade: { cls: "hum", icon: "ti-droplet" },
  luminosidade: { cls: "pres", icon: "ti-bulb" },
  consumo: { cls: "co2", icon: "ti-bolt" },
};

function sensorIcon(tipo) {
  const t = String(tipo || "").toLowerCase();
  for (const key of Object.keys(SENSOR_ICONS)) {
    if (t.includes(key)) return SENSOR_ICONS[key];
  }
  return { cls: "pres", icon: "ti-cpu" };
}

function sensorIdOf(sensor) {
  return sensor?.id_sensor ?? sensor?.id;
}

function isActiveSensor(sensor) {
  const estado = String(sensor.estado || "").toLowerCase();
  return estado !== "offline" && estado !== "inativo";
}

async function fetchLatest(sensorId) {
  if (!sensorId) return null;
  try {
    const res = await fetchWithAuth(`/api/sensores/${sensorId}/latest`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function loadUserFromApi() {
  try {
    const res = await fetchWithAuth("/api/auth/me");
    if (!res.ok) return;
    const data = await res.json();
    if (data?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...data.user,
          name: data.user.nome || data.user.name,
        }),
      );
    }
  } catch {
    /* ignore */
  }
}

async function loadSensors() {
  const list = document.getElementById("sensor-list");
  try {
    const res = await fetchWithAuth("/api/sensores");
    if (!res.ok) throw new Error("sensores");
    const sensors = await res.json();
    const active = sensors.filter(isActiveSensor);

    document.getElementById("kpi-sensors").textContent = active.length;
    document.getElementById("online-count").textContent = `${active.length} online`;
    document.getElementById("kpi-sensors-sub").textContent = `${sensors.length} sensores total`;

    const withReadings = await Promise.all(
      sensors.slice(0, 8).map(async (s) => ({
        sensor: s,
        latest: await fetchLatest(sensorIdOf(s)),
      })),
    );

    const temps = withReadings
      .filter(({ sensor, latest }) =>
        /temperatura/i.test(sensor.tipo_sensor || "") && latest?.valor != null,
      )
      .map(({ latest }) => Number(latest.valor))
      .filter(Number.isFinite);

    if (temps.length) {
      const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
      document.getElementById("kpi-temp").textContent = `${avg.toFixed(1)}°`;
      document.getElementById("kpi-temp-sub").textContent = `${temps.length} leituras`;
    } else {
      document.getElementById("kpi-temp-sub").textContent = "sem dados";
    }

    list.innerHTML = "";
    withReadings.slice(0, 5).forEach(({ sensor, latest }) => {
      const { cls, icon } = sensorIcon(sensor.tipo_sensor);
      const val =
        latest?.valor != null
          ? `${latest.valor}${latest.unidade || ""}`
          : "—";
      const estado = String(sensor.estado || "ok").toLowerCase();
      const dotCls =
        estado === "offline" || estado === "inativo"
          ? "err"
          : estado.includes("manuten")
            ? "warn"
            : "ok";
      const valStyle =
        dotCls === "err"
          ? "color:var(--txt3)"
          : dotCls === "warn"
            ? "color:var(--red)"
            : "";

      list.insertAdjacentHTML(
        "beforeend",
        `<div class="srow">
          <div class="sico ${cls}"><i class="ti ${icon}" aria-hidden="true"></i></div>
          <div class="si">
            <div class="sn">${sensor.nome || sensor.tipo_sensor || "Sensor"}</div>
            <div class="sl">${(sensor.localizacao || "—").toLowerCase().replace(/\s+/g, "-")}</div>
          </div>
          <div class="sv" style="${valStyle}">${val}</div>
          <div class="sdot ${dotCls}"></div>
        </div>`,
      );
    });

    document.getElementById("readings-ts").textContent = "atualizado agora";

    const alertCount = sensors.filter((s) => {
      const e = String(s.estado || "").toLowerCase();
      return e.includes("manuten") || e === "inativo";
    }).length;
    document.getElementById("kpi-alerts").textContent = String(alertCount);
    document.getElementById("kpi-alerts-sub").textContent = `${alertCount} sensores`;
    document.getElementById("alerts-meta").textContent = `${alertCount} ativo${alertCount !== 1 ? "s" : ""}`;

    renderAlertsFromSensors(sensors);
  } catch {
    list.innerHTML = '<div class="muted">Erro ao carregar sensores.</div>';
  }
}

function renderAlertsFromSensors(sensors) {
  const list = document.getElementById("alert-list");
  const flagged = sensors.filter((s) => {
    const e = String(s.estado || "").toLowerCase();
    return e.includes("manuten") || e === "inativo";
  });

  if (!flagged.length) {
    list.innerHTML = `<div class="ai ok">
      <i class="ti ti-check" aria-hidden="true"></i>
      <div><div class="at">Todos os sensores operacionais</div><div class="ats">sem alertas</div></div>
    </div>`;
    return;
  }

  list.innerHTML = "";
  flagged.slice(0, 4).forEach((s) => {
    const cls = String(s.estado).toLowerCase().includes("manuten") ? "w" : "e";
    const icon = cls === "w" ? "ti-alert-triangle" : "ti-alert-circle";
    list.insertAdjacentHTML(
      "beforeend",
      `<div class="ai ${cls}">
        <i class="ti ${icon}" aria-hidden="true"></i>
        <div>
          <div class="at">${s.nome || "Sensor"} — ${s.estado}</div>
          <div class="ats">${s.localizacao || "—"} · #${sensorIdOf(s)}</div>
        </div>
      </div>`,
    );
  });
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

async function loadConsumo() {
  try {
    let res = await fetchWithAuth("/api/reports");
    if (!res.ok) res = await fetchWithAuth("/api/consumo/consumption");
    if (!res.ok) return;

    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return;

    const byDay = new Map();
    data.forEach((row) => {
      const d = new Date(row.periodo_fim || row.updatedAt || Date.now());
      const key = d.toLocaleDateString("pt-PT");
      const val = Number(row.consumo ?? row.value ?? 0);
      byDay.set(key, (byDay.get(key) || 0) + val);
    });

    const entries = [...byDay.entries()].slice(-7);
    const nums = entries.map(([, v]) => v);
    const labels = entries.map(([k], i) => {
      const d = new Date(k.split("/").reverse().join("-"));
      return Number.isNaN(d.getTime()) ? DAYS[i % 7] : DAYS[d.getDay()];
    });

    const max = Math.max(...nums, 1);
    const total = nums.reduce((a, b) => a + b, 0);
    const peakIdx = nums.indexOf(Math.max(...nums));

    document.getElementById("chart-total").textContent =
      `${Math.round(total).toLocaleString("pt-PT")} kWh`;
    document.getElementById("chart-peak").textContent =
      `${labels[peakIdx] || "—"} · ${Math.round(nums[peakIdx] || 0)} kWh`;
    document.getElementById("kpi-consumo").textContent = Math.round(
      nums[nums.length - 1] || 0,
    ).toLocaleString("pt-PT");
    document.getElementById("kpi-consumo-sub").textContent = "kWh (último dia)";

    const chart = document.getElementById("chart");
    chart.innerHTML = "";
    nums.forEach((v, i) => {
      const pct = Math.round((v / max) * 100);
      const isLast = i === nums.length - 1;
      const isPeak = i === peakIdx;
      const bg = isLast ? "#ff6b00" : isPeak ? "#cc4400" : "#2a1400";
      const labelColor = isLast ? "#ff6b00" : "#4a4540";
      chart.insertAdjacentHTML(
        "beforeend",
        `<div class="bw">
          <div class="bv">${Math.round(v)}</div>
          <div class="b" style="height:${pct}%;background:${bg};"></div>
          <div class="bl" style="color:${labelColor}">${labels[i]}</div>
        </div>`,
      );
    });
  } catch {
    document.getElementById("kpi-consumo-sub").textContent = "sem dados";
  }
}

async function loadRooms() {
  const grid = document.getElementById("room-grid");
  try {
    const res = await fetchWithAuth("/api/salas");
    if (!res.ok) throw new Error("salas");
    const salas = await res.json();
    document.getElementById("rooms-meta").textContent =
      `${salas.length} sala${salas.length !== 1 ? "s" : ""}`;

    grid.innerHTML = "";
    salas.slice(0, 6).forEach((sala, i) => {
      const name = sala.name || sala.nome || `Sala ${i + 1}`;
      const href = `detalhe_departamento.html?room=${encodeURIComponent(sala.id)}`;
      grid.insertAdjacentHTML(
        "beforeend",
        `<a class="rc ${i === 0 ? "act" : ""}" href="${href}">
          <div class="rn">${name}</div>
          <div class="rm"><span class="rmv">${sala.badge || "Ativo"}</span></div>
          <div class="rbar"><div class="rfill" style="width:${50 + i * 8}%;background:${i === 0 ? "var(--ora)" : "var(--txt3)"}"></div></div>
        </a>`,
      );
    });
  } catch {
    grid.innerHTML = '<div class="muted" style="grid-column:1/-1">Erro ao carregar salas.</div>';
  }
}

async function loadAll() {
  await loadUserFromApi();
  await Promise.allSettled([loadSensors(), loadConsumo(), loadRooms()]);
}


document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user) return;

  setupShell("dashboard");
  startTimestampClock();

  document.getElementById("btn-refresh")?.addEventListener("click", loadAll);

  await loadAll();
  setInterval(loadSensors, 30000);
});

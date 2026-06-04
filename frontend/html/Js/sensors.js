async function fetchSensorRooms() {
  try {
    const response = await fetchWithAuth("/api/salas");

    if (!response.ok) {
      throw new Error("Erro ao carregar salas");
    }

    const rooms = await response.json();
    const list = Array.isArray(rooms) ? rooms : Object.values(rooms);

    return list.reduce((acc, room) => {
      acc[room.id] = room;
      return acc;
    }, {});
  } catch (error) {
    console.error(error);
    return {};
  }
}

function getSensorByType(room, typeRegExp) {
  if (!room || !Array.isArray(room.sensors)) {
    return null;
  }

  return room.sensors.find((sensor) =>
    typeRegExp.test(sensor.tipo_sensor)
  );
}

async function fetchLatestReading(sensorId) {
  if (!sensorId) return null;

  try {
    const response = await fetchWithAuth(`/api/sensores/${sensorId}/latest`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Erro ao obter leituras:", error);
    return null;
  }
}

function parseReadingValue(reading) {
  if (!reading) return null;

  const value = Number(reading.valor);

  return Number.isFinite(value) ? value : null;
}

function formatRoomKey(roomName = "") {
  return String(roomName)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

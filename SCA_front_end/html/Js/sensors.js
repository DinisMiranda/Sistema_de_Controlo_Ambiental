async function fetchSensorRooms() {
  try {
    const response = await fetchWithAuth("/api/rooms");

    if (!response.ok) {
      throw new Error("Erro ao carregar salas");
    }

    const rooms = await response.json();

    return Object.values(rooms).reduce((acc, room) => {
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
    const response = await fetchWithAuth(
      `/api/sensores/${sensorId}/readings`
    );

    if (!response.ok) {
      return null;
    }

    const readings = await response.json();

    if (!Array.isArray(readings) || readings.length === 0) {
      return null;
    }

    return readings[0];
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
  return roomName
}

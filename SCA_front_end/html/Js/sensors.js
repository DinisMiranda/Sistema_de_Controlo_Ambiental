async function fetchSensorRooms() {
  try {
    const response = await fetchWithAuth('/api/sensores');
    if (!response.ok) throw new Error('Erro ao carregar salas');

    const rooms = await response.json();

    return rooms.reduce((acc, room) => {
      const key = formatRoomKey(room.nome_sala || room.name || `room-${room.id}`);
      acc[key] = room;
      return acc;
    }, {});
  } catch (error) {
    console.error(error);
    return {};
  }
}

function getSensorByType(room, typeRegExp) {
  if (!room || !Array.isArray(room.sensors)) return null;
  return room.sensors.find((sensor) => typeRegExp.test(sensor.tipo_sensor));
}

async function fetchLatestReading(sensorId) {
  if (!sensorId) return null;

  try {
    const response = await fetchWithAuth(`/api/sensores/${sensorId}/readings`);
    if (!response.ok) return null;

    const readings = await response.json();
    return Array.isArray(readings) && readings.length > 0 ? readings[0] : null;
  } catch (error) {
    console.error('Erro ao carregar leituras do sensor:', error);
    return null;
  }
}

function parseReadingValue(reading) {
  const value = Number.parseFloat(reading?.valor ?? reading?.value);
  return Number.isFinite(value) ? value : null;
}

function formatRoomKey(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_');
}

function setLoadingState(elements = []) {
  elements.forEach((element) => {
    if (element) element.textContent = '...';
  });
}

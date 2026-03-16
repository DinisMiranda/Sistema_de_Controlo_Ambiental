# SCA Backend (API)

REST API in Node.js + Express + TypeScript for the Environmental Control System.

## Scripts

- `npm run dev` – development server with hot reload (tsx)
- `npm run build` – compile TypeScript to `dist/`
- `npm run start` – run `dist/index.js` (after build)
- `npm run lint` – ESLint

## Environment variables

Copy `.env.example` to `.env` and set:

- `PORT` – server port (default 3001)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` – MySQL connection

## Endpoints (examples)

- `GET /health` – health check
- `GET /health/db` – database connection check
- `GET /api/sensores` – list sensors
- `GET /api/sensores/:id` – get sensor
- `GET /api/atuadores` – list actuators
- `GET /api/atuadores/:id` – get actuator

Additional routes (Tipos, Utilizadores, readings, actions, parameters, consumption, auth) can be added under `src/routes/`. The schema uses database **sistema_controlo_ambiental2**.

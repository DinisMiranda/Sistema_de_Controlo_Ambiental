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
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_DIALECT` – MySQL/Sequelize connection
- `SYNC_MODELS` – if `true`, runs `sequelize.sync({ alter: true })` at startup (development only)

## Endpoints (examples)

- `GET /health` – health check
- `GET /health/db` – database connection check
- `GET /api/sensores` – list sensors
- `GET /api/sensores/:id` – get sensor
- `GET /api/atuadores` – list actuators
- `GET /api/atuadores/:id` – get actuator
- `POST /api/auth/register` and `POST /api/auth/login` – basic auth flow
- `GET /api/tipos`, `GET /api/sensores`, `GET /api/atuadores` – core resources
- `GET /api/sensors/:id/readings` and `POST /api/sensors/:id/readings`
- `GET /api/actuators/:id/actions` and `POST /api/actuators/:id/actions`
- `GET /api/sensors/:id/consumption` and admin `GET /api/consumption`
- admin `GET/POST/PATCH /api/automatic-parameters`

Additional routes (Tipos, Utilizadores, readings, actions, parameters, consumption, auth) can be added under `src/routes/`. The schema uses database **sistema_controlo_ambiental2**.

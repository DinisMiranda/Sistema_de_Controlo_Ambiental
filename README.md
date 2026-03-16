# Environmental Control System (SCA)

Monitoring and control system for sensors, actuators, and consumption records.

## Project structure

```
Sistema_de_Controlo_Ambiental/
├── frontend/     # Web app (React + Vite + TypeScript)
├── backend/       # REST API (Node.js + Express + TypeScript)
├── database/      # MySQL schema and scripts
├── docs/          # Documentation and references
├── docker-compose.yml
└── .gitignore
```

## Prerequisites

- **Node.js** 18+
- **MySQL** 8+ (or Docker)
- **npm** or **pnpm**

## Quick start

### 1. Database

With Docker (from this folder):

```bash
docker compose up -d db
```

Then import the schema (root password: `sca_root`). The database name is **sistema_controlo_ambiental2**:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -psca_root < database/schema.sql
```

Without Docker: create the database and import `database/schema.sql` in your MySQL server.

### 2. Backend (API)

```bash
cd backend
cp .env.example .env   # edit with DB credentials and port
npm install
npm run dev
```

API runs at `http://localhost:3001` (or the port set in `.env`).

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # optional: set VITE_API_URL to backend URL
npm install
npm run dev
```

Web UI at `http://localhost:5173`.

## Environment variables

- **Backend**: copy `backend/.env.example` to `backend/.env`. With Docker: `DB_HOST=127.0.0.1`, `DB_USER=root`, `DB_PASSWORD=sca_root`, `DB_NAME=sistema_controlo_ambiental2`.
- **Frontend**: see `frontend/.env.example`. In development the Vite proxy forwards `/api` to the backend, so `VITE_API_URL` can be left empty.

## Main entities (schema sistema_controlo_ambiental2)

- **Tipos** – type catalogue referenced by sensors, actuators, and actions
- **Utilizadores** and **administradores** – users and admins
- **sensores** and **atuadores** – devices (FK to Tipos)
- **leituras_sensor** – sensor readings over time
- **acoes_sistema** – actions on actuators
- **parametros_automaticos** – linked to system actions
- **registos_consumo** – consumption per period (FK to sensores)

## Tech stack

| Layer       | Stack                         |
|------------|--------------------------------|
| Frontend   | React, Vite, TypeScript       |
| Backend    | Node.js, Express, TypeScript  |
| Database   | MySQL 8                       |

## Documentation

See `docs/` for design and data model documents.

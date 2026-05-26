# Environmental Control System (SCA)

A monitoring and control system for environmental sensors, actuators, and consumption records.

---

## Table of contents

- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Data model](#data-model)
- [Tech stack](#tech-stack)
- [Documentation](#documentation)

---

## Project structure

| Path | Purpose |
| ---- | ------- |
| `frontend/` | Web UI — HTML, CSS, JavaScript (`frontend/html/`) |
| `backend/` | REST API — Node.js, Express, TypeScript |
| `database/` | MySQL schema (`schema.sql`) and seed CSV generators (`database/scripts/`) |
| `docs/` | Design docs, use cases, and references |
| `docker-compose.yml` | Local MySQL 8 service for development |

---

## Prerequisites

- **Node.js** 18 or later
- **Docker Desktop** (recommended) or local **MySQL** 8
- **Python 3** (optional, for seed CSV scripts)

---

## Quick start

Run from the **project root** (`Sistema_de_Controlo_Ambiental/`).

### 1. Database (Docker)

```bash
docker compose up -d db
docker exec -i sca-mysql mysql -u root -psca_root sistema_controlo_ambiental2 < database/schema.sql
```

Default Docker credentials: `root` / `sca_root`, host port **3307**.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: **http://localhost:3001**

### 3. Frontend

Serve the static UI (do not open HTML files directly with `file://`):

```bash
cd frontend
python3 -m http.server 5173
```

Open: **http://localhost:5173/html/login.html**

Test login: `admin@edificio.com` / `admin123`

---

## Configuration

| Component | Config file | Notes |
| --------- | ----------- | ----- |
| **Docker (DB)** | `docker-compose.env.example` → `.env` | Optional overrides at repo root |
| **Backend** | `backend/.env.example` → `backend/.env` | With Docker: `DB_PORT=3307`, `DB_PASSWORD=sca_root` |
| **Seed scripts** | `database/scripts/.env.example` → `database/scripts/.env` | CSV output paths and row counts |

---

## Data model

Schema: **sistema_controlo_ambiental2**

| Entity | Description |
| ------ | ----------- |
| **Tipos** | Type catalogue (sensors, actuators, actions) |
| **Utilizadores** | System users (admin flag) |
| **casas** | Buildings / homes |
| **sensores** / **atuadores** | Sensors and actuators |
| **leituras_sensor** | Sensor readings |
| **acoes_sistema** | Actuator actions |
| **parametros_automaticos** | Automatic control parameters |
| **registos_consumo** | Consumption records |

---

## Tech stack

| Layer | Stack |
| ----- | ----- |
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express, TypeScript, Sequelize |
| Database | MySQL 8 |

---

## Documentation

- **`docs/`** — design documents and integration notes
- **`database/scripts/README.md`** — fake data CSV generators

To regenerate all seed CSVs:

```bash
cd database/scripts
./generate_seed_csvs.sh
```

## Quick start (integration)

```bash
docker compose up -d db
docker exec -i sca-mysql mysql -u root -psca_root sistema_controlo_ambiental2 < database/schema.sql
./database/import/import_csv.sh
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && python3 -m http.server 5173
```

Open `http://localhost:5173/html/login.html`. See `database/README.md` for import details.

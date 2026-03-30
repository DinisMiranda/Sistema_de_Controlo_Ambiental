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
|------|--------|
| `frontend/` | Web UI — React, Vite, TypeScript |
| `backend/` | REST API — Node.js, Express, TypeScript |
| `database/` | MySQL schema and migration scripts |
| `docs/` | Design docs, use cases, and references |
| `scripts/` | Fake data generators (see `scripts/README.md`) |
| `docker-compose.yml` | Local MySQL 8 service for development |

---

## Prerequisites

- **Node.js** 18.20.8 or later ([v18.20.8 release](https://nodejs.org/en/blog/release/v18.20.8); newer LTS/current versions are fine)  
- **MySQL** 8 (or use the provided Docker setup)  
- **npm** or **pnpm**

---

## Quick start

Run from the **project root** (`Sistema_de_Controlo_Ambiental/`).

### 1. Database

Start MySQL with Docker:

```bash
docker compose up -d db
```

Wait until the container is healthy, then load the schema:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -psca_root < database/schema.sql
```

Database name: `sistema_controlo_ambiental2`.

**Without Docker:** create the database in your MySQL server and run `database/schema.sql`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials (see Configuration)
npm install
npm run dev
```

API: **http://localhost:3001**

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Optional: set VITE_API_URL if not using the dev proxy
npm install
npm run dev
```

UI: **http://localhost:5173**

---

## Configuration

| Component | Config file | Notes |
|-----------|-------------|--------|
| **Docker (DB)** | `docker-compose.env.example` → `.env` | Optional overrides; do not commit `.env`. |
| **Backend** | `backend/.env.example` → `backend/.env` | Required. With default Docker: `DB_HOST=127.0.0.1`, `DB_USER=root`, `DB_PASSWORD=sca_root`, `DB_NAME=sistema_controlo_ambiental2`. |
| **Frontend** | `frontend/.env.example` → `frontend/.env` | Optional in dev; Vite proxies `/api` to the backend. |

---

## Data model

Schema: **sistema_controlo_ambiental2**

| Entity | Description |
|--------|-------------|
| **Tipos** | Type catalogue (referenced by sensors, actuators, actions). |
| **Utilizadores** / **administradores** | Users and administrators. |
| **sensores** / **atuadores** | Sensors and actuators (FK to Tipos). |
| **leituras_sensor** | Sensor readings over time. |
| **acoes_sistema** | Actions performed on actuators. |
| **parametros_automaticos** | Configuration parameters (linked to actions). |
| **registos_consumo** | Consumption per period (FK to sensores). |

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL 8 |

---

## Documentation

Design documents, use cases, and data model references are in **`docs/`**.

Fake data scripts (e.g. **`Utilizadores`** / **`Tipos`** CSV output) are documented in **`scripts/README.md`** and in the module docstrings under **`scripts/`**.

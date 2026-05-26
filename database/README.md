# Database – Environmental Control System

Schema: **sistema_controlo_ambiental2** (MySQL 8+).

## Files

- **schema.sql** – Schema and table definitions (MySQL Workbench export).

## Tables

| Table                  | Description                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Tipos                  | Type catalogue (classe, tipo, descrição). Referenced by sensores, atuadores, and acoes_sistema. |
| Utilizadores           | System users (nome, email, palavra_passe_hash, admin).                                          |
| sensores               | Sensors; FK to Tipos (Tipos_classe, Tipos_tipo).                                                |
| atuadores              | Actuators; FK to Tipos.                                                                         |
| acoes_sistema          | Actions on actuators; FK to atuadores and Tipos.                                                |
| leituras_sensor        | Sensor readings (valor, unidade, timestamp).                                                    |
| parametros_automaticos | Configuration parameters; FK to **atuadores**.                                                  |
| registos_consumo       | Consumption per period; FK to **leituras_sensor**.                                              |

**Note:** `sensores` / `atuadores` / `acoes_sistema` reference **Tipos** only via `Tipos_classe` and `Tipos_tipo`.

## How to apply

### With Docker (from project root)

```bash
docker compose up -d db
# When MySQL is ready (default host port 3307):
docker exec -i sca-mysql mysql -u root -psca_root sistema_controlo_ambiental2 < database/schema.sql
```

### Local MySQL

```bash
mysql -u root -p < database/schema.sql
```

Or run `schema.sql` in MySQL Workbench.

## Seed data (CSV → MySQL)

Generate CSVs (if needed):

```bash
cd database/scripts
./generate_seed_csvs.sh
```

Import into the database (truncates and reloads all seed tables):

```bash
./database/import/import_csv.sh
```

Environment overrides (optional):

| Variable | Default |
| -------- | ------- |
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3307` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `sca_root` |
| `DB_NAME` | `sistema_controlo_ambiental2` |
| `USE_DOCKER` | `1` (uses `docker exec` into `sca-mysql`) |
| `MYSQL_CONTAINER` | `sca-mysql` |

Import a single table:

```bash
./database/import/import_csv.sh tipos
./database/import/import_csv.sh sensores leituras_sensor
```

**Order matters** for foreign keys. Use `all` (default) for a full reload.

**Note:** Import assigns explicit ids `1..N` for casas, utilizadores, sensores, atuadores and leituras so CSV foreign keys stay valid. After import, disable `SYNC_MODELS=true` in backend dev or avoid `sequelize.sync({ alter: true })` on seeded tables.

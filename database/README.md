# Database – Environmental Control System

Schema: **sistema_controlo_ambiental2** (MySQL 8+).

## Files

- **schema.sql** – Schema and table definitions (MySQL Workbench export).

## Tables

| Table                  | Description |
|------------------------|-------------|
| Tipos                  | Type catalogue (classe, tipo, descrição). Referenced by sensores, atuadores, and acoes_sistema. |
| Utilizadores           | System users (nome, email, palavra_passe_hash, admin). |
| administradores        | Administrators (nome, email, palavra_passe_hash). |
| sensores               | Sensors; FK to Tipos (Tipos_classe, Tipos_tipo). |
| atuadores              | Actuators; FK to Tipos. |
| acoes_sistema          | Actions on actuators; FK to atuadores and Tipos. |
| leituras_sensor        | Sensor readings (valor, unidade, timestamp). |
| parametros_automaticos  | Configuration parameters; FK to acoes_sistema. |
| registos_consumo        | Consumption per period; FK to **sensores** (id_sensor). |

**Note:** `registos_consumo` references `sensores`, not atuadores. The columns `Tipos_id_administrador` in sensores/atuadores/acoes_sistema are not part of the FK to Tipos (only `Tipos_classe` and `Tipos_tipo` are).

## How to apply

### With Docker (from project root, i.e. Sistema_de_Controlo_Ambiental)

```bash
docker compose up -d db
# When MySQL is ready:
mysql -h 127.0.0.1 -P 3306 -u root -psca_root < database/schema.sql
```

### Local MySQL

```bash
mysql -u root -p < database/schema.sql
```

Or run `schema.sql` in MySQL Workbench.

# Scripts — fake data generation

Utilities that generate **CSV files** (UTF-8, header row) for reviewing fake rows before loading them into MySQL (or for spreadsheets). They do **not** connect to the database by default.

## `seed_utilizadores.py`

Generates rows shaped like the **`Utilizadores`** table in schema `sistema_controlo_ambiental2`.

### Prerequisites

From this folder (`scripts/`):

```bash
python3 -m venv .venv
.venv/bin/pip install Faker python-dotenv
```

Use **`.venv/bin/python`** (or `source .venv/bin/activate`) so dependencies are available. Avoid installing into the system Python on macOS (PEP 668 / Homebrew).

**Caminho:** o `cd` tem de apontar para a pasta `scripts/` dentro do clone do projeto (substitui `/caminho/para/` pelo caminho real; `…` não é válido no terminal).

### How to run

```bash
cd /caminho/para/Sistema_de_Controlo_Ambiental/scripts
.venv/bin/python seed_utilizadores.py
.venv/bin/python seed_utilizadores.py -n 20
.venv/bin/python seed_utilizadores.py -n 20 --seed 42
```

Optional config: copy `.env.example` → `.env` in **`scripts/`** (not committed).

| Variable | Meaning |
|----------|--------|
| `NUM_UTILIZADORES` | Row count if you omit `-n` (default **20** in code). Must be a valid integer or the script exits with a message. |
| `UTILIZADORES_OUTPUT` | Output file path (UTF-8 CSV; **overwritten** each run). Default: `generated/utilizadores_examination.csv`. |

**Precedence:** `-n` / `--count` beats `NUM_UTILIZADORES`. `--seed` is only from the CLI.

**Reproducibility:** Same `--seed`, same `-n`, and **no prior file at the output path** ⇒ identical file. If a file **already exists**, emails from it are reserved first, so the new file will **not** match a “from scratch” run with the same seed (that is expected).

### Email uniqueness across runs

If the **output file already exists**, the script reads the **email** column (CSV with header, or legacy pipe-separated `.txt`) and new rows will **not** reuse those addresses, even though the file is overwritten.

This does **not** read other files or the database; use one canonical output path or merge files yourself if you need global uniqueness.

### Output file

- **Default path:** `scripts/generated/utilizadores_examination.csv` (folder is gitignored).
- **Format:** CSV with header: `nome`, `email`, `palavra_passe_hash`, `data_criacao`, `admin`.
- **Email:** `firstname.lastname@example.pt` (ASCII; collisions get `firstname.lastname2@example.pt`, etc.).
- **Admin:** `0` or `1`. Each row is drawn with **independent** probability **1/20** for `1` — not “exactly one admin every 20 users.”

### Map to the database table

| CSV column | SQL column (`Utilizadores`) |
|-------------|-----------------------------|
| nome | `nome` |
| email | `email` |
| palavra_passe_hash | `palavra_passe_hash` (`demo:` + Faker `sha256()` — not a production hash) |
| data_criacao | `data_criacao` |
| admin | `admin` (0/1) |

Primary key `id_administrador` is **not** in the file; MySQL assigns it on `INSERT`.

### Reading the code

Execution order in `main()`:

1. `parse_args()` — CLI (`-n`, `--seed`).
2. `load_env_from_script_dir()` — optional `scripts/.env`.
3. `create_faker()` — `pt_PT` locale; seeds `random` + Faker if `--seed` set.
4. `resolve_config()` — row count + output path → `SeedConfig`.
5. `load_emails_from_existing_output()` — emails already in the target file (if it exists).
6. `build_utilizadores_rows()` — build data rows (merges prior emails into the uniqueness set).
7. `write_utilizadores_csv()` — create parent dirs, write UTF-8 CSV.

More detail lives in the **module docstring** at the top of `seed_utilizadores.py` and in **function docstrings** next to each helper.

## `seed_tipos.py`

Generates rows shaped like the **`Tipos`** table (`classe`, `tipo`, `descrição`). **Tudo vai no mesmo CSV** — sensores, atuadores e **tipos de ação** (`classe=Acao_sistema`) para classificar linhas em `acoes_sistema` (FK `Tipos_classe` / `Tipos_tipo`).

O catálogo tem **quatro sensores**, **quatro atuadores** (1:1 com os sensores) e **sete tipos de ação** (ligar/desligar luz, consigna de climatização, ventilação, corte/restabelecimento de circuito, disparo automático por limite). O campo `tipo_acao` na tabela `acoes_sistema` continua a ser o texto curto do comando (ex.: `ON`, `22`); o par `(Tipos_classe, Tipos_tipo)` categoriza a ação. Cada `tipo` em `Tipos` é único globalmente.

**Importante:** export completo = **15** linhas (4 + 4 + 7). Só sensores: `-n 4`. Sensores + atuadores: `-n 8`. Tudo: omite `-n` / usa `NUM_TIPOS=15`.

**Dependencies:** `python-dotenv` only (same venv as `seed_utilizadores.py`; Faker is not used).

### How to run

```bash
cd /caminho/para/Sistema_de_Controlo_Ambiental/scripts
.venv/bin/python seed_tipos.py
.venv/bin/python seed_tipos.py -n 2
```

| Variable | Meaning |
|----------|--------|
| `NUM_TIPOS` | Max rows from catalog if you omit `-n` (default = **15**: 4 sensores + 4 atuadores + 7 ações). |
| `TIPOS_OUTPUT` | Output path. Default: `generated/tipos_examination.csv`. |

**Precedence:** `-n` / `--count` beats `NUM_TIPOS`.

### Output file

- **Default:** `scripts/generated/tipos_examination.csv`
- **Format:** CSV with header: `classe`, `tipo`, `descricao` (maps to SQL `` `descrição` `` — use backticks in `INSERT`).

### Map to the database table

| CSV column | SQL column (`Tipos`) |
|-------------|-------------------------|
| classe | `classe` (PK part 1) |
| tipo | `tipo` (PK part 2; also UNIQUE) |
| descricao | `descrição` |

### Load order

Insert **`Tipos`** before **`sensores`**, **`atuadores`**, and **`acoes_sistema`** (FKs referenciam `Tipos.classe` / `Tipos.tipo`). Garante que existem linhas `Acao_sistema` / … antes de inserir `acoes_sistema`. Carrega **`leituras_sensor`** antes de **`registos_consumo`** (FK para `id_leitura`).

### Import safety checklist

1. **`Tipos`** — Use the **full** catalog (default or `NUM_TIPOS=15`) before loading `sensores`, `atuadores`, or `acoes_sistema`. A partial export (`-n` too small) breaks foreign keys (see warnings from `seed_tipos.py` on stderr).
2. **`Utilizadores.palavra_passe_hash`** — Values are **not** production password hashes (bcrypt/Argon2); only for demos and local DBs.
3. **`Casa_Administradores`** — `id_casa` / `id_utilizador` must match real `AUTO_INCREMENT` values after you load **`casas`** and **`Utilizadores`** in order with **no gaps** you did not account for. Prefer `seed_casa_administradores.py --casas-csv` / `--utilizadores-csv` so bounds follow your CSV row counts.
4. **Column names** — MySQL column `descrição` in `Tipos` may need backticks in `INSERT`; map CSV `descricao` accordingly.

## `seed_acoes_sistema.py`

Gera linhas para **`acoes_sistema`**: `id_atuador`, `tipo_acao`, `valor_aplicado`, `motivo`, `timestamp_acao`, `Tipos_classe`, `Tipos_tipo`. A coluna `Tipos_tipo` usa apenas tipos com `classe=Acao_sistema` do catálogo em `seed_tipos.py` (importa **Tipos** completo e **atuadores** antes desta tabela).

```bash
cd /caminho/para/Sistema_de_Controlo_Ambiental/scripts
.venv/bin/python seed_acoes_sistema.py
.venv/bin/python seed_acoes_sistema.py -n 50 --seed 42
.venv/bin/python seed_acoes_sistema.py --atuadores-csv generated/atuadores_examination.csv
```

| Variable | Meaning |
|----------|---------|
| `NUM_ACOES_SISTEMA` | Row count if you omit `-n` (default **40**). |
| `NUM_ATUADORES` | Max `id_atuador` when not using `--atuadores-csv` / `--max-atuador-id` (default **20**). |
| `ACOES_SISTEMA_OUTPUT` | Output path. Default: `generated/acoes_sistema_examination.csv`. |

Primary key `id_acao` is not in the CSV; MySQL assigns it on `INSERT`.

## `seed_registros_consumo.py`

Gera linhas para **`registos_consumo`**: `consumo`, `unidade`, `periodo_inicio`, `periodo_fim`, `leituras_sensor_id_leitura`. O período de fim é sempre posterior ao de início.

```bash
cd /caminho/para/Sistema_de_Controlo_Ambiental/scripts
.venv/bin/python seed_registros_consumo.py
.venv/bin/python seed_registros_consumo.py -n 50 --seed 42
.venv/bin/python seed_registros_consumo.py --leituras-csv generated/leituras_sensor_examination.csv
```

| Variable | Meaning |
|----------|---------|
| `NUM_REGISTOS_CONSUMO` | Row count if you omit `-n` (default **50**). |
| `REGISTROS_MAX_LEITURA_ID` | Max `leituras_sensor_id_leitura` when not using `--leituras-csv` / `--max-leitura-id` (default **120**). |
| `REGISTOS_CONSUMO_OUTPUT` | Output path. Default: `generated/registos_consumo_examination.csv`. |

Primary key `id_registo` is not in the CSV; MySQL assigns it on `INSERT`.

### Related files

- `.env.example` — template for `scripts/.env`
- `generated/` — default output directory (ignored by git)

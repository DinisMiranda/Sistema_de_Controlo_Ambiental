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
| palavra_passe_hash | `palavra_passe_hash` (Faker `sha256()` — fake, not a real password hash) |
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

Insert **`Tipos`** before **`sensores`**, **`atuadores`**, and **`acoes_sistema`** (FKs referenciam `Tipos.classe` / `Tipos.tipo`). Garante que existem linhas `Acao_sistema` / … antes de inserir `acoes_sistema`.

### Related files

- `.env.example` — template for `scripts/.env`
- `generated/` — default output directory (ignored by git)

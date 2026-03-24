# Scripts — fake data generation

Utilities that generate **text files** for reviewing fake rows before loading them into MySQL (or for documentation). They do **not** connect to the database by default.

## `seed_utilizadores.py`

Generates rows shaped like the **`Utilizadores`** table in schema `sistema_controlo_ambiental2`.

### Prerequisites

From this folder (`scripts/`):

```bash
python3 -m venv .venv
.venv/bin/pip install Faker python-dotenv
```

Use **`.venv/bin/python`** (or `source .venv/bin/activate`) so dependencies are available. Avoid installing into the system Python on macOS (PEP 668 / Homebrew).

### How to run

```bash
cd …/Sistema_de_Controlo_Ambiental/scripts
.venv/bin/python seed_utilizadores.py
.venv/bin/python seed_utilizadores.py -n 20
.venv/bin/python seed_utilizadores.py -n 20 --seed 42
```

Optional config: copy `.env.example` → `.env` in **`scripts/`** (not committed).

| Variable | Meaning |
|----------|--------|
| `NUM_UTILIZADORES` | Row count if you omit `-n` (default **20** in code). Must be a valid integer or the script exits with a message. |
| `UTILIZADORES_OUTPUT` | Output file path (UTF-8; **overwritten** each run). Default: `generated/utilizadores_examination.txt`. |

**Precedence:** `-n` / `--count` beats `NUM_UTILIZADORES`. `--seed` is only from the CLI.

**Reproducibility:** Same `--seed`, same `-n`, and **no prior file at the output path** ⇒ identical file. If a file **already exists**, emails from it are reserved first, so the new file will **not** match a “from scratch” run with the same seed (that is expected).

### Email uniqueness across runs

If the **output file already exists**, the script reads its data lines first and collects the **email** column. New rows will **not** reuse those addresses, even though the file is overwritten — so uniqueness applies **across consecutive runs** that target the **same path**.

This does **not** read other files or the database; use one canonical output path or merge files yourself if you need global uniqueness.

### Output file

- **Default path:** `scripts/generated/utilizadores_examination.txt` (folder is gitignored).
- Lines starting with `#` are comments (format, admin semantics, email pattern).
- **Data lines** are pipe-separated:

  `nome | email | palavra_passe_hash | data_criacao | admin`

- **Email:** `firstname.lastname@example.pt` (ASCII; collisions get `firstname.lastname2@example.pt`, etc.).
- **Admin:** `0` or `1`. Each row is drawn with **independent** probability **1/20** for `1` — not “exactly one admin every 20 users.”

### Map to the database table

| File column | SQL column (`Utilizadores`) |
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
6. `build_utilizadores_lines()` — build all lines in memory (merges prior emails into the uniqueness set).
7. `write_lines_to_file()` — create parent dirs, write UTF-8.

More detail lives in the **module docstring** at the top of `seed_utilizadores.py` and in **function docstrings** next to each helper.

### Related files

- `.env.example` — template for `scripts/.env`
- `generated/` — default output directory (ignored by git)

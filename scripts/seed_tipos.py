"""
Fake rows for the ``Tipos`` table — **UTF-8 CSV** by default; direct MySQL load is planned
(``--db`` hook; not implemented yet).

**Um único ficheiro CSV** (ex.: ``generated/tipos_examination.csv``) contém **toda** a tabela
``Tipos``: **sensores**, **atuadores** e **ações de sistema** na mesma grelha (colunas
``classe``, ``tipo``, ``descricao``). A classe ``Acao_sistema`` classifica linhas em
``acoes_sistema`` (FK ``Tipos_classe`` / ``Tipos_tipo``); o campo ``tipo_acao`` na tabela
continua a descrever o comando curto (ex.: ON, OFF, 21.5).

Composite primary key: ``(classe, tipo)``. The physical schema also defines a **unique**
index on ``tipo`` alone, so every ``tipo`` value must be **globally** distinct.

**Run** (from ``scripts/``)::

    .venv/bin/python seed_tipos.py
    .venv/bin/python seed_tipos.py -n 2
    .venv/bin/python seed_tipos.py -o generated/meu_tipos.csv
    .venv/bin/python seed_tipos.py --db   # shows that MySQL load is not implemented yet

By default the script **writes a UTF-8 CSV**. ``--csv`` / ``--no-csv`` toggle the file;
``--no-csv`` alone exits until ``--db`` can insert rows. ``--db`` is reserved for a future
direct MySQL load; until then, use CSV and import with your client or ``LOAD DATA``.

``-n`` / ``--count`` limits how many rows are taken from the catalog (from the start;
max = catalog size). ``-o`` / ``--output`` overrides the CSV path for this run.

Optional env: ``NUM_TIPOS``, ``TIPOS_OUTPUT`` (see ``.env.example``).

The default catalog has **four sensors**, **four paired actuators**, plus **seven action
types** (``classe=Acao_sistema``) for classifying what happened in ``acoes_sistema``.
All rows share one CSV. Every ``tipo`` is unique (MySQL ``UNIQUE`` on ``tipo``).
"""

import argparse
import csv
import os
import sys
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

TIPOS_FIELDNAMES = ("classe", "tipo", "descricao")

# Catalog: each ``tipo`` must be unique (MySQL UNIQUE on ``tipo``).
# ``descrição`` column max VARCHAR(255) — keep lines under limit.
#
# Order: sensores → atuadores pareados (1:1) → tipos de ação para ``acoes_sistema``.
TIPOS_CATALOG: list[tuple[str, str, str]] = [
    ("Sensor", "Luminosidade", "Nível de luminosidade ambiente."),
    (
        "Sensor",
        "Temperatura_ambiente",
        "Medição de temperatura do ar interior, habitualmente em °C.",
    ),
    ("Sensor", "Humidade_relativa", "Humidade relativa do ar em percentagem."),
    (
        "Sensor",
        "Consumo_energetico_kWh",
        "Medidor de consumo ou energia elétrica acumulada, habitualmente em kWh.",
    ),
    # Atuadores alinhados aos tipos de sensor acima (1 → 1).
    (
        "Atuador",
        "Iluminacao_regulatoria_Luminosidade",
        "Regulação de iluminação (ex.: LED) associada ao sensor tipo Luminosidade.",
    ),
    (
        "Atuador",
        "Climatizacao_Temperatura_ambiente",
        "Climatização / aquecimento-arrefecimento associado ao sensor Temperatura_ambiente.",
    ),
    (
        "Atuador",
        "Ventilacao_Humidade_relativa",
        "Ventilação ou tratamento de ar associado ao sensor Humidade_relativa.",
    ),
    (
        "Atuador",
        "Rele_circuito_Consumo_energetico_kWh",
        "Relé ou contactor para comutação de circuito associado ao medidor Consumo_energetico_kWh.",
    ),
    # Classificação de ações (``acoes_sistema``.Tipos_classe / Tipos_tipo). Cada ``tipo``
    # é único; escolhe o que melhor descreve a ação (conforto, poupança, proteção).
    (
        "Acao_sistema",
        "Iluminacao_ligar_ou_aumentar",
        "Ação de ligar ou aumentar iluminação (baixa luminosidade ou comando).",
    ),
    (
        "Acao_sistema",
        "Iluminacao_desligar_ou_reduzir",
        "Ação de desligar ou reduzir iluminação (excesso de luz ou poupança).",
    ),
    (
        "Acao_sistema",
        "Climatizacao_definir_consigna",
        "Ação de alterar consigna ou modo de climatização (temperatura alvo).",
    ),
    (
        "Acao_sistema",
        "Ventilacao_reforco_ou_arranque",
        "Ação de ativar ou intensificar ventilação (humidade, renovação de ar).",
    ),
    (
        "Acao_sistema",
        "Circuito_energia_corte",
        "Ação de corte: relé aberto ou circuito desenergizado (proteção ou gestão de carga).",
    ),
    (
        "Acao_sistema",
        "Circuito_energia_restabelecer",
        "Ação de restabelecer alimentação ao circuito (relé fechado).",
    ),
    (
        "Acao_sistema",
        "Controlo_automatico_por_limite",
        "Ação disparada automaticamente por regra ou limiar (parametrização automática).",
    ),
]


def parse_args() -> argparse.Namespace:
    """Define and parse CLI: row count, CSV path, CSV on/off, and reserved ``--db`` flag."""
    parser = argparse.ArgumentParser(
        description="Write Tipos-shaped rows (catalog) to a UTF-8 CSV file."
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="max rows from catalog (default: all). Overrides NUM_TIPOS in scripts/.env",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        metavar="PATH",
        help="CSV output path (overrides TIPOS_OUTPUT / default for this run)",
    )
    parser.add_argument(
        "--csv",
        dest="write_csv",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="write UTF-8 CSV (default: yes)",
    )
    parser.add_argument(
        "--db",
        action="store_true",
        help="(planned) load rows into MySQL; not implemented — use CSV import for now",
    )
    return parser.parse_args()


def load_env_from_script_dir(base_dir: Path) -> None:
    """Load ``scripts/.env`` if present so ``os.getenv`` sees ``NUM_TIPOS`` / ``TIPOS_OUTPUT``."""
    env_path = base_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def parse_int_env(var_name: str, default: int) -> int:
    """
    Read ``var_name`` from the environment; return ``default`` if unset or blank.

    Exits with a clear message if the value is non-empty but not a valid integer.
    """
    raw = os.getenv(var_name)
    if raw is None:
        return default
    stripped = raw.strip()
    if stripped == "":
        return default
    try:
        return int(stripped)
    except ValueError:
        raise SystemExit(
            f"{var_name} must be an integer, got {raw!r} "
            "(check scripts/.env or your shell environment)."
        ) from None


@dataclass(frozen=True)
class TiposConfig:
    num_rows: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> TiposConfig:
    """
    Combine CLI and environment into row count and CSV path.

    Row count: ``args.count`` if set, else ``NUM_TIPOS`` from env, else full catalog length.

    Output path: ``args.output`` if set, else ``TIPOS_OUTPUT`` from env, else
    ``generated/tipos_examination.csv`` under ``base_dir``.
    """
    catalog_len = len(TIPOS_CATALOG)
    if args.count is not None:
        num_rows = args.count
    else:
        num_rows = parse_int_env("NUM_TIPOS", catalog_len)

    if num_rows < 1:
        raise SystemExit("Row count must be at least 1.")
    if num_rows > catalog_len:
        raise SystemExit(
            f"Requested {num_rows} rows but catalog has only {catalog_len}. "
            f"Extend TIPOS_CATALOG in seed_tipos.py or use -n {catalog_len}."
        )

    if args.output is not None:
        output_path = args.output
    else:
        output_path = Path(
            os.getenv(
                "TIPOS_OUTPUT",
                str(base_dir / "generated" / "tipos_examination.csv"),
            )
        )
    return TiposConfig(num_rows=num_rows, output_path=output_path)


def catalog_rows_to_lists(rows: list[tuple[str, str, str]]) -> list[list[str]]:
    """Turn catalog tuples into string rows; enforce ``descricao`` length for ``VARCHAR(255)``."""
    out: list[list[str]] = []
    for classe, tipo, desc in rows:
        if len(desc) > 255:
            raise ValueError(f"Description too long for VARCHAR(255): {tipo!r}")
        out.append([classe, tipo, desc])
    return out


def write_tipos_csv(output_path: Path, rows: list[list[str]]) -> None:
    """Write UTF-8 CSV with header ``TIPOS_FIELDNAMES`` and one row per tipo."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(TIPOS_FIELDNAMES)
        writer.writerows(rows)


def load_tipos_to_db(_rows: list[list[str]], _config: TiposConfig) -> None:
    """
    Reserved for a future MySQL connection (e.g. ``INSERT`` or ``executemany``).

    Today: exit with a clear message; use CSV (with or without ``--db`` on the CLI) and
    ``LOAD DATA`` / your SQL tool until this is implemented.
    """
    raise SystemExit(
        "Direct MySQL insert is not implemented yet. "
        "Omit --db to write a CSV, then import with your client or LOAD DATA."
    )


def main() -> None:
    """
    Parse CLI, load ``scripts/.env``, build catalog slice, optionally call ``load_tipos_to_db``,
    and write CSV when ``--csv`` is enabled.
    """
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    config = resolve_config(args, base_dir)
    selected = TIPOS_CATALOG[: config.num_rows]
    rows = catalog_rows_to_lists(selected)

    if args.db:
        load_tipos_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit(
            "CSV output is disabled (--no-csv) and --db is not available yet. Nothing to do."
        )

    if args.write_csv:
        write_tipos_csv(config.output_path, rows)
        print(f"Wrote {len(selected)} tipo(s) to {config.output_path}")
        full = len(TIPOS_CATALOG)
        if len(selected) < full:
            print(
                f"Note: CSV has only the first {len(selected)} of {full} catalog rows "
                f"(sensors + actuators). Omit -n and NUM_TIPOS for the full Tipos file.",
                file=sys.stderr,
            )


if __name__ == "__main__":
    main()

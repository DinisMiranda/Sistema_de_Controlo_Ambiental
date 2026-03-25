"""
Fake rows for the ``Tipos`` table — **UTF-8 CSV** (no MySQL connection).

**Um único ficheiro CSV** (ex.: ``generated/tipos_examination.csv``) contém **toda** a tabela
``Tipos``: tipos de **sensor** e de **atuador** na mesma grelha (colunas ``classe``,
``tipo``, ``descricao``). Não há ficheiro separado para atuadores.

Composite primary key: ``(classe, tipo)``. The physical schema also defines a **unique**
index on ``tipo`` alone, so every ``tipo`` value must be **globally** distinct.

**Run** (from ``scripts/``)::

    .venv/bin/python seed_tipos.py
    .venv/bin/python seed_tipos.py -n 2

``-n`` limits how many rows are taken from the catalog (from the start; max = catalog size).
Optional env: ``NUM_TIPOS``, ``TIPOS_OUTPUT`` (see ``.env.example``).

The default catalog has **four sensors** and **four actuators** in **1:1 correspondence**
(light, temperatura, humidade, consumo energético kWh → atuadores correspondentes).
All rows share one CSV. Every ``tipo`` is unique (MySQL ``UNIQUE`` on ``tipo``).
"""

from __future__ import annotations

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
# Order: sensores, depois atuadores (cada atuador corresponde ao sensor na mesma posição).
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
]


def parse_args() -> argparse.Namespace:
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
    return parser.parse_args()


def load_env_from_script_dir(base_dir: Path) -> None:
    env_path = base_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def parse_int_env(var_name: str, default: int) -> int:
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

    output_path = Path(
        os.getenv(
            "TIPOS_OUTPUT",
            str(base_dir / "generated" / "tipos_examination.csv"),
        )
    )
    return TiposConfig(num_rows=num_rows, output_path=output_path)


def catalog_rows_to_lists(rows: list[tuple[str, str, str]]) -> list[list[str]]:
    out: list[list[str]] = []
    for classe, tipo, desc in rows:
        if len(desc) > 255:
            raise ValueError(f"Description too long for VARCHAR(255): {tipo!r}")
        out.append([classe, tipo, desc])
    return out


def write_tipos_csv(output_path: Path, rows: list[list[str]]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(TIPOS_FIELDNAMES)
        writer.writerows(rows)


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    config = resolve_config(args, base_dir)
    selected = TIPOS_CATALOG[: config.num_rows]
    rows = catalog_rows_to_lists(selected)
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

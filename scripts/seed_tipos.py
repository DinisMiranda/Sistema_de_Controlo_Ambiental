"""
Fake rows for the ``Tipos`` table — **text file only** (no MySQL connection).

Composite primary key: ``(classe, tipo)``. The physical schema also defines a **unique**
index on ``tipo`` alone, so every ``tipo`` value must be **globally** distinct.

**Run** (from ``scripts/``)::

    .venv/bin/python seed_tipos.py
    .venv/bin/python seed_tipos.py -n 2

``-n`` limits how many rows are taken from the catalog (from the start; max = catalog size).
Optional env: ``NUM_TIPOS``, ``TIPOS_OUTPUT`` (see ``.env.example``).

The default catalog is **three sensor types**: ``Luminosidade``, ``Temperatura_ambiente``,
``Humidade_relativa`` (all ``classe=Sensor``).
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Catalog: each ``tipo`` must be unique (MySQL UNIQUE on ``tipo``).
# ``descrição`` column max VARCHAR(255) — keep lines under limit.
TIPOS_CATALOG: list[tuple[str, str, str]] = [
    ("Sensor", "Luminosidade", "Nível de luminosidade ambiente."),
    (
        "Sensor",
        "Temperatura_ambiente",
        "Medição de temperatura do ar interior, habitualmente em °C.",
    ),
    ("Sensor", "Humidade_relativa", "Humidade relativa do ar em percentagem."),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Write Tipos-shaped rows (catalog) to a UTF-8 text file."
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
            str(base_dir / "generated" / "tipos_examination.txt"),
        )
    )
    return TiposConfig(num_rows=num_rows, output_path=output_path)


def build_tipos_lines(rows: list[tuple[str, str, str]]) -> list[str]:
    lines: list[str] = [
        "# Tipos — generated for examination (not inserted into DB)",
        "# MySQL column: descrição (backtick in INSERT). File header uses ASCII.",
        "# Format: classe | tipo | descricao",
        "# Schema: PK (classe, tipo); UNIQUE on tipo — each tipo value must be unique.",
        "",
    ]
    for classe, tipo, desc in rows:
        if " | " in classe or " | " in tipo or " | " in desc:
            raise ValueError("Catalog entries must not contain ' | ' (field separator).")
        if len(desc) > 255:
            raise ValueError(f"Description too long for VARCHAR(255): {tipo!r}")
        lines.append(f"{classe} | {tipo} | {desc}")
    return lines


def write_lines_to_file(output_path: Path, lines: list[str]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    config = resolve_config(args, base_dir)
    selected = TIPOS_CATALOG[: config.num_rows]
    lines = build_tipos_lines(selected)
    write_lines_to_file(config.output_path, lines)
    print(f"Wrote {len(selected)} tipo(s) to {config.output_path}")


if __name__ == "__main__":
    main()

"""
Gera linhas para a tabela ``sensores`` (CSV UTF-8), alinhadas ao ``schema.sql`` atual.

Cada linha referencia ``Tipos`` com ``Tipos_classe=Sensor`` e ``Tipos_tipo`` igual a um
dos quatro tipos do catálogo em ``seed_tipos.py`` (primeiras entradas ``Sensor`` em
``TIPOS_CATALOG``). Carrega ``Tipos`` antes de importar sensores.

Execução (na pasta ``scripts/``)::

    .venv/bin/python seed_sensores.py
    .venv/bin/python seed_sensores.py -n 24
    .venv/bin/python seed_sensores.py -n 8 --seed 3

Env opcional: ``NUM_SENSORES``, ``SENSORES_OUTPUT``.

Ruas e datas vêm do Faker ``pt_PT`` (Portugal). Os valores de ``Tipos_tipo`` / ``tipo_sensor``
seguem o catálogo técnico em ``seed_tipos.py`` (identificadores, não frases longas).
"""

from __future__ import annotations

import argparse
import csv
import os
import random
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from faker import Faker

from seed_tipos import TIPOS_CATALOG

SENSORES_FIELDNAMES = (
    "nome",
    "tipo_sensor",
    "localizacao",
    "estado",
    "data_instalacao",
    "Tipos_classe",
    "Tipos_tipo",
)

TIPO_CLASSE_SENSOR = "Sensor"

# Mantido em sincronia com as linhas ``Sensor`` no início de ``TIPOS_CATALOG``.
SENSOR_TIPOS: list[str] = [row[1] for row in TIPOS_CATALOG if row[0] == TIPO_CLASSE_SENSOR]

ESTADOS = ("ativo", "inativo", "manutenção")

LOCAL_LABELS = (
    "Sala",
    "Sala de estar",
    "Cozinha",
    "Quarto",
    "Casa de banho",
    "Corredor",
    "Hall",
    "Garagem",
    "Escritório",
    "Arrumos",
    "Cave",
    "Ático",
    "Marquise",
)


def clip(text: str, max_len: int) -> str:
    t = text.strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 3].rstrip() + "..."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate sensores rows to a UTF-8 CSV.")
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="number of sensor rows (overrides NUM_SENSORES in scripts/.env)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        metavar="N",
        help="optional seed for reproducible output",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        metavar="PATH",
        help="CSV path (overrides SENSORES_OUTPUT / default)",
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
        help="(planned) load into MySQL — not implemented",
    )
    return parser.parse_args()


def create_faker(locale: str, seed: int | None) -> Faker:
    if seed is not None:
        random.seed(seed)
    faker = Faker(locale)
    if seed is not None:
        faker.seed_instance(seed)
    return faker


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
class SensoresConfig:
    num_sensores: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> SensoresConfig:
    if not SENSOR_TIPOS:
        raise SystemExit(
            "No Sensor types in seed_tipos.TIPOS_CATALOG; fix catalog or script."
        )
    if args.count is not None:
        num = args.count
    else:
        num = parse_int_env("NUM_SENSORES", 20)
    if num < 1:
        raise SystemExit("Sensor count must be at least 1.")

    if args.output is not None:
        out = args.output
    else:
        out = Path(
            os.getenv(
                "SENSORES_OUTPUT",
                str(base_dir / "generated" / "sensores_examination.csv"),
            )
        )
    return SensoresConfig(num_sensores=num, output_path=out)


def _pick_localizacao(faker: Faker) -> str:
    base = random.choice(LOCAL_LABELS)
    if random.random() < 0.4:
        return clip(f"{base} — {faker.street_name()}", 100)
    if random.random() < 0.3:
        return clip(f"{base} {random.randint(1, 4)}", 100)
    return clip(base, 100)


def build_sensores_rows(faker: Faker, n: int) -> list[list[str]]:
    rows: list[list[str]] = []
    for _ in range(n):
        tipos_tipo = random.choice(SENSOR_TIPOS)
        tipo_sensor = clip(tipos_tipo, 50)
        loc = _pick_localizacao(faker)
        nome = clip(f"Sensor — {tipos_tipo} ({loc})", 100)
        estado = random.choice(ESTADOS)
        if random.random() < 0.08:
            data_inst = ""
        else:
            d = faker.date_between(start_date="-4y", end_date="today")
            data_inst = d.isoformat()

        rows.append(
            [
                nome,
                tipo_sensor,
                loc,
                estado,
                data_inst,
                TIPO_CLASSE_SENSOR,
                tipos_tipo,
            ]
        )
    return rows


def write_sensores_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(SENSORES_FIELDNAMES)
        w.writerows(rows)


def load_sensores_to_db(_rows: list[list[str]], _config: SensoresConfig) -> None:
    raise SystemExit(
        "Direct MySQL insert is not implemented yet. "
        "Omit --db to write a CSV, then import with your client or LOAD DATA."
    )


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    faker = create_faker("pt_PT", args.seed)
    config = resolve_config(args, base_dir)
    rows = build_sensores_rows(faker, config.num_sensores)

    if args.db:
        load_sensores_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit(
            "CSV output is disabled (--no-csv) and --db is not available yet. Nothing to do."
        )

    if args.write_csv:
        write_sensores_csv(config.output_path, rows)
        print(f"Wrote {config.num_sensores} sensor(es) to {config.output_path}")


if __name__ == "__main__":
    main()

"""
Gera linhas para a tabela ``casas`` (só dados da residência) para um CSV UTF-8.

A relação utilizadores↔casas (N:N ou outra) fica para uma migração futura; este ficheiro
não escreve FKs para ``Utilizadores``.

Execução (na pasta ``scripts/``, com o mesmo venv que ``seed_utilizadores.py``)::

    .venv/bin/python seed_casas.py
    .venv/bin/python seed_casas.py -n 15
    .venv/bin/python seed_casas.py -n 5 --seed 7
    .venv/bin/python seed_casas.py -o generated/meu_casas.csv

Variáveis opcionais em ``scripts/.env``: ``NUM_CASAS``, ``CASAS_OUTPUT``.
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

CASAS_FIELDNAMES = ("nome", "morada", "codigo_postal", "data_criacao")


def clip(text: str, max_len: int) -> str:
    """Garante ``VARCHAR(max_len)`` no destino SQL."""
    t = text.strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 3].rstrip() + "..."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate fake casas rows to a UTF-8 CSV.")
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="number of houses (overrides NUM_CASAS in scripts/.env)",
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
        help="CSV path (overrides CASAS_OUTPUT / default)",
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
class CasasConfig:
    num_casas: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> CasasConfig:
    if args.count is not None:
        num = args.count
    else:
        num = parse_int_env("NUM_CASAS", 10)
    if num < 1:
        raise SystemExit("House count must be at least 1.")

    if args.output is not None:
        out = args.output
    else:
        out = Path(
            os.getenv(
                "CASAS_OUTPUT",
                str(base_dir / "generated" / "casas_examination.csv"),
            )
        )
    return CasasConfig(num_casas=num, output_path=out)


def build_casas_rows(faker: Faker, n: int) -> list[list[str]]:
    rows: list[list[str]] = []
    for _ in range(n):
        street = faker.street_name()
        nome = clip(f"Casa — {street}", 100)
        morada = clip(faker.street_address(), 150)
        codigo_postal = clip(faker.postcode(), 255)
        data_criacao = faker.date_time_between(start_date="-5y", end_date="now")
        rows.append(
            [
                nome,
                morada,
                codigo_postal,
                data_criacao.strftime("%Y-%m-%d %H:%M:%S"),
            ]
        )
    return rows


def write_casas_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(CASAS_FIELDNAMES)
        w.writerows(rows)


def load_casas_to_db(_rows: list[list[str]], _config: CasasConfig) -> None:
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
    rows = build_casas_rows(faker, config.num_casas)

    if args.db:
        load_casas_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit(
            "CSV output is disabled (--no-csv) and --db is not available yet. Nothing to do."
        )

    if args.write_csv:
        write_casas_csv(config.output_path, rows)
        print(f"Wrote {config.num_casas} casa(s) to {config.output_path}")


if __name__ == "__main__":
    main()

"""
Gera linhas para a tabela ``registos_consumo`` (CSV UTF-8).

Cada linha referencia ``leituras_sensor.id_leitura`` (coluna ``leituras_sensor_id_leitura``).
Importa **leituras_sensor** antes de ``registos_consumo``.

Ordem de carga na BD: ``leituras_sensor`` → ``registos_consumo``.

Execução (na pasta ``scripts/``)::

    .venv/bin/python seed_registros_consumo.py
    .venv/bin/python seed_registros_consumo.py -n 60 --seed 3
    .venv/bin/python seed_registros_consumo.py --leituras-csv generated/leituras_sensor_examination.csv

Env opcional: ``NUM_REGISTOS_CONSUMO``, ``REGISTROS_MAX_LEITURA_ID`` (limite de ``id_leitura`` sem
``--leituras-csv`` / ``--max-leitura-id``), ``REGISTOS_CONSUMO_OUTPUT``.
"""

from __future__ import annotations

import argparse
import csv
import os
import random
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from faker import Faker

REGISTOS_CONSUMO_FIELDNAMES = (
    "consumo",
    "unidade",
    "periodo_inicio",
    "periodo_fim",
    "leituras_sensor_id_leitura",
)

UNIDADES = ("kWh", "kWh", "kWh", "MWh")


def clip(text: str, max_len: int) -> str:
    t = text.strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 3].rstrip() + "..."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gerar linhas de registos_consumo (CSV UTF-8) com FK a leituras_sensor."
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="número de linhas (sobrepõe NUM_REGISTOS_CONSUMO)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        metavar="N",
        help="semente opcional para repetir o mesmo ficheiro",
    )
    parser.add_argument(
        "--max-leitura-id",
        type=int,
        default=None,
        metavar="N",
        help="maior id_leitura válido (sobrepõe REGISTROS_MAX_LEITURA_ID; default 120)",
    )
    parser.add_argument(
        "--leituras-csv",
        type=Path,
        default=None,
        metavar="PATH",
        help="CSV de leituras_sensor: max id = linhas de dados (sem cabeçalho); ignorado se --max-leitura-id",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        metavar="PATH",
        help="caminho do CSV (sobrepõe REGISTOS_CONSUMO_OUTPUT)",
    )
    parser.add_argument(
        "--csv",
        dest="write_csv",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="escrever CSV UTF-8 (por defeito: sim)",
    )
    parser.add_argument(
        "--db",
        action="store_true",
        help="(previsto) carga MySQL — ainda não implementado",
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


def count_csv_data_rows(path: Path) -> int:
    if not path.is_file():
        raise SystemExit(f"Ficheiro CSV não encontrado: {path}")
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if header is None:
            return 0
        return sum(1 for _ in reader)


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
            f"{var_name} tem de ser inteiro, recebi {raw!r} (vê scripts/.env)."
        ) from None


@dataclass(frozen=True)
class RegistrosConfig:
    num_rows: int
    max_leitura_id: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> RegistrosConfig:
    if args.count is not None:
        num = args.count
    else:
        num = parse_int_env("NUM_REGISTOS_CONSUMO", 50)
    if num < 1:
        raise SystemExit("O número de registos tem de ser >= 1.")

    if args.max_leitura_id is not None:
        max_lid = args.max_leitura_id
    elif args.leituras_csv is not None:
        max_lid = count_csv_data_rows(args.leituras_csv)
    else:
        max_lid = parse_int_env("REGISTROS_MAX_LEITURA_ID", 120)

    if max_lid < 1:
        raise SystemExit("O limite de id_leitura tem de ser >= 1.")

    if args.output is not None:
        out = args.output
    else:
        out = Path(
            os.getenv(
                "REGISTOS_CONSUMO_OUTPUT",
                str(base_dir / "generated" / "registos_consumo_examination.csv"),
            )
        )
    return RegistrosConfig(num_rows=num, max_leitura_id=max_lid, output_path=out)


def build_registros_rows(faker: Faker, n: int, max_leitura_id: int) -> list[list[str]]:
    rows: list[list[str]] = []
    for _ in range(n):
        id_lit = random.randint(1, max_leitura_id)
        consumo = random.uniform(0.02, 999.99)
        unidade = clip(random.choice(UNIDADES), 20)
        if unidade == "MWh":
            consumo = random.uniform(0.01, 50.0)
        inicio = faker.date_time_between(start_date="-150d", end_date="now")
        duracao = timedelta(
            hours=random.randint(1, 24 * 14),
            minutes=random.randint(0, 59),
        )
        fim = inicio + duracao
        rows.append(
            [
                f"{consumo:.2f}",
                unidade,
                inicio.strftime("%Y-%m-%d %H:%M:%S"),
                fim.strftime("%Y-%m-%d %H:%M:%S"),
                str(id_lit),
            ]
        )
    return rows


def write_registros_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(REGISTOS_CONSUMO_FIELDNAMES)
        w.writerows(rows)


def load_to_db(_rows: list[list[str]], _config: RegistrosConfig) -> None:
    raise SystemExit(
        "Inserção direta em MySQL ainda não está implementada. "
        "Gera o CSV sem --db e importa com o cliente ou LOAD DATA."
    )


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    faker = create_faker("pt_PT", args.seed)
    config = resolve_config(args, base_dir)
    rows = build_registros_rows(faker, config.num_rows, config.max_leitura_id)

    if args.db:
        load_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit("CSV desligado e --db indisponível. Nada a fazer.")

    if args.write_csv:
        write_registros_csv(config.output_path, rows)
        print(
            f"Escreveu {len(rows)} linha(s) em {config.output_path} "
            f"(leituras_sensor_id_leitura ∈ 1..{config.max_leitura_id})."
        )


if __name__ == "__main__":
    main()

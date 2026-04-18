"""
Gera linhas para a tabela ``leituras_sensor`` (CSV UTF-8).

Cada linha referencia ``sensores.id_sensor``. O ``valor`` e a ``unidade`` são coerentes
com o ``Tipos_tipo`` do sensor quando usas ``--sensores-csv`` (mesma ordem de importação:
primeira linha de dados → ``id_sensor`` = 1). Sem CSV, os valores são gerados a partir de
um tipo de sensor aleatório por leitura (pode não bater com o sensor real na BD).

Ordem de carga na BD: ``Tipos`` → ``sensores`` → ``leituras_sensor``.

Execução (na pasta ``scripts/``)::

    .venv/bin/python seed_leituras_sensor.py
    .venv/bin/python seed_leituras_sensor.py -n 200 --seed 5
    .venv/bin/python seed_leituras_sensor.py -n 100 --sensores-csv generated/sensores_examination.csv

Env opcional: ``NUM_LEITURAS_SENSOR``, ``NUM_SENSORES`` (limite de ``id_sensor`` sem CSV),
``LEITURAS_SENSOR_OUTPUT``.
"""

from __future__ import annotations

import argparse
import csv
import os
import random
import sys
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from faker import Faker

from seed_sensores import SENSOR_TIPOS

LEITURAS_SENSOR_FIELDNAMES = (
    "id_sensor",
    "valor",
    "unidade",
    "timestamp_leitura",
)


def clip(text: str, max_len: int) -> str:
    t = text.strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 3].rstrip() + "..."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gerar leituras de sensor (CSV UTF-8) com FK a sensores."
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="número de linhas (sobrepõe NUM_LEITURAS_SENSOR)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        metavar="N",
        help="semente opcional para repetir o mesmo ficheiro",
    )
    parser.add_argument(
        "--max-sensor-id",
        type=int,
        default=None,
        metavar="N",
        help="maior id_sensor válido (sobrepõe NUM_SENSORES; default 20)",
    )
    parser.add_argument(
        "--sensores-csv",
        type=Path,
        default=None,
        metavar="PATH",
        help="CSV de sensores: tipos por linha; max id = linhas de dados; ignorado se --max-sensor-id",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        metavar="PATH",
        help="caminho do CSV (sobrepõe LEITURAS_SENSOR_OUTPUT)",
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


def load_tipos_tipo_por_id_sensor(path: Path) -> list[str]:
    """Uma entrada por ``id_sensor`` (1 = primeira linha de dados)."""
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None or "Tipos_tipo" not in reader.fieldnames:
            raise SystemExit(
                "O CSV de sensores tem de ter cabeçalho com coluna Tipos_tipo."
            )
        out: list[str] = []
        for row in reader:
            t = (row.get("Tipos_tipo") or "").strip()
            if not t:
                raise SystemExit("Linha de sensor sem Tipos_tipo no CSV.")
            out.append(t)
    if not out:
        raise SystemExit("CSV de sensores sem linhas de dados.")
    return out


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
class LeiturasConfig:
    num_rows: int
    max_sensor_id: int
    tipos_por_sensor: list[str] | None
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> LeiturasConfig:
    if args.count is not None:
        num = args.count
    else:
        num = parse_int_env("NUM_LEITURAS_SENSOR", 120)
    if num < 1:
        raise SystemExit("O número de leituras tem de ser >= 1.")

    tipos_por_sensor: list[str] | None = None
    if args.max_sensor_id is not None:
        max_sid = args.max_sensor_id
        if args.sensores_csv is not None:
            print(
                "Nota: --max-sensor-id sobrepõe --sensores-csv; tipos de leitura serão aleatórios.",
                file=sys.stderr,
            )
    elif args.sensores_csv is not None:
        tipos_por_sensor = load_tipos_tipo_por_id_sensor(args.sensores_csv)
        max_sid = len(tipos_por_sensor)
    else:
        max_sid = parse_int_env("NUM_SENSORES", 20)
        print(
            "Aviso: sem --sensores-csv, valor/unidade usam um tipo de sensor aleatório por "
            "leitura; pode não coincidir com o sensor na BD. Prefer --sensores-csv.",
            file=sys.stderr,
        )

    if max_sid < 1:
        raise SystemExit("O limite de id_sensor tem de ser >= 1.")

    if args.output is not None:
        out = args.output
    else:
        out = Path(
            os.getenv(
                "LEITURAS_SENSOR_OUTPUT",
                str(base_dir / "generated" / "leituras_sensor_examination.csv"),
            )
        )
    return LeiturasConfig(
        num_rows=num,
        max_sensor_id=max_sid,
        tipos_por_sensor=tipos_por_sensor,
        output_path=out,
    )


def _valor_unidade_para_tipo(tipos_tipo: str) -> tuple[str, str]:
    """Devolve (valor formatado, unidade) com VARCHAR(20) na unidade."""
    if tipos_tipo == "Luminosidade":
        v = random.uniform(15.0, 980.0)
        return (f"{v:.2f}", clip("lx", 20))
    if tipos_tipo == "Temperatura_ambiente":
        v = random.uniform(14.5, 29.5)
        return (f"{v:.2f}", clip("°C", 20))
    if tipos_tipo == "Humidade_relativa":
        v = random.uniform(28.0, 82.0)
        return (f"{v:.2f}", clip("%", 20))
    if tipos_tipo == "Consumo_energetico_kWh":
        v = random.uniform(0.0, 420.0)
        return (f"{v:.2f}", clip("kWh", 20))
    v = random.uniform(0.0, 100.0)
    return (f"{v:.2f}", clip("u", 20))


def build_leituras_rows(
    faker: Faker,
    n: int,
    max_sensor_id: int,
    tipos_por_sensor: list[str] | None,
) -> list[list[str]]:
    rows: list[list[str]] = []
    for _ in range(n):
        sid = random.randint(1, max_sensor_id)
        if tipos_por_sensor is not None:
            tipo = tipos_por_sensor[sid - 1]
        else:
            tipo = random.choice(SENSOR_TIPOS)
        valor, unidade = _valor_unidade_para_tipo(tipo)
        ts = faker.date_time_between(start_date="-120d", end_date="now")
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
        rows.append([str(sid), valor, unidade, ts_str])
    return rows


def write_leituras_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(LEITURAS_SENSOR_FIELDNAMES)
        w.writerows(rows)


def load_to_db(_rows: list[list[str]], _config: LeiturasConfig) -> None:
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
    rows = build_leituras_rows(
        faker,
        config.num_rows,
        config.max_sensor_id,
        config.tipos_por_sensor,
    )

    if args.db:
        load_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit("CSV desligado e --db indisponível. Nada a fazer.")

    if args.write_csv:
        write_leituras_csv(config.output_path, rows)
        print(
            f"Escreveu {len(rows)} leitura(s) em {config.output_path} "
            f"(id_sensor ∈ 1..{config.max_sensor_id})."
        )


if __name__ == "__main__":
    main()

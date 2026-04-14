"""
Gera linhas para a tabela ``acoes_sistema`` (CSV UTF-8).

Cada linha referencia ``atuadores.id_atuador`` e um par ``(Tipos_classe, Tipos_tipo)`` com
``classe=Acao_sistema`` (linhas correspondentes em ``seed_tipos.py`` / CSV de Tipos).
Importa ``Tipos`` (catálogo completo, ``n`` ≥ 15) e ``atuadores`` antes de ``acoes_sistema``.

Ordem de carga na BD: ``Tipos`` → ``atuadores`` → ``acoes_sistema``.

Execução (na pasta ``scripts/``)::

    .venv/bin/python seed_acoes_sistema.py
    .venv/bin/python seed_acoes_sistema.py -n 50
    .venv/bin/python seed_acoes_sistema.py -n 30 --seed 7 --atuadores-csv generated/atuadores_examination.csv

Env opcional: ``NUM_ACOES_SISTEMA``, ``NUM_ATUADORES`` (limite de ``id_atuador`` se não usares
``--atuadores-csv`` / ``--max-atuador-id``), ``ACOES_SISTEMA_OUTPUT``.
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

ACOES_SISTEMA_FIELDNAMES = (
    "id_atuador",
    "tipo_acao",
    "valor_aplicado",
    "motivo",
    "timestamp_acao",
    "Tipos_classe",
    "Tipos_tipo",
)

TIPO_CLASSE_ACAO = "Acao_sistema"
ACAO_TIPOS: list[str] = [row[1] for row in TIPOS_CATALOG if row[0] == TIPO_CLASSE_ACAO]


def clip(text: str, max_len: int) -> str:
    t = text.strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 3].rstrip() + "..."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gerar linhas de acoes_sistema (CSV UTF-8) com FKs a atuadores e Tipos."
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="número de linhas (sobrepõe NUM_ACOES_SISTEMA)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        metavar="N",
        help="semente opcional para repetir o mesmo ficheiro",
    )
    parser.add_argument(
        "--max-atuador-id",
        type=int,
        default=None,
        metavar="N",
        help="maior id_atuador válido (sobrepõe NUM_ATUADORES; default 20)",
    )
    parser.add_argument(
        "--atuadores-csv",
        type=Path,
        default=None,
        metavar="PATH",
        help="CSV de atuadores: max id = linhas de dados (sem cabeçalho); ignorado se --max-atuador-id",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        metavar="PATH",
        help="caminho do CSV (sobrepõe ACOES_SISTEMA_OUTPUT)",
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
class AcoesSistemaConfig:
    num_rows: int
    max_atuador_id: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> AcoesSistemaConfig:
    if not ACAO_TIPOS:
        raise SystemExit(
            "Sem tipos Acao_sistema em seed_tipos.TIPOS_CATALOG; corrige o catálogo."
        )
    if args.count is not None:
        num = args.count
    else:
        num = parse_int_env("NUM_ACOES_SISTEMA", 40)
    if num < 1:
        raise SystemExit("O número de ações tem de ser >= 1.")

    if args.max_atuador_id is not None:
        max_aid = args.max_atuador_id
    elif args.atuadores_csv is not None:
        max_aid = count_csv_data_rows(args.atuadores_csv)
    else:
        max_aid = parse_int_env("NUM_ATUADORES", 20)

    if max_aid < 1:
        raise SystemExit("O limite de id_atuador tem de ser >= 1.")

    if args.output is not None:
        out = args.output
    else:
        out = Path(
            os.getenv(
                "ACOES_SISTEMA_OUTPUT",
                str(base_dir / "generated" / "acoes_sistema_examination.csv"),
            )
        )
    return AcoesSistemaConfig(num_rows=num, max_atuador_id=max_aid, output_path=out)


def _sample_tipo_acao_valor(tipos_tipo: str) -> tuple[str, str]:
    """Short command + value for ``tipo_acao`` / ``valor_aplicado`` (VARCHAR 50)."""
    if tipos_tipo == "Iluminacao_ligar_ou_aumentar":
        return random.choice([("ON", "100%"), ("UP", "90%"), ("DIM_UP", "75%")])
    if tipos_tipo == "Iluminacao_desligar_ou_reduzir":
        return random.choice([("OFF", "0%"), ("DOWN", "25%"), ("MIN", "5%")])
    if tipos_tipo == "Climatizacao_definir_consigna":
        v = f"{random.uniform(18.0, 24.0):.1f}"
        return ("SETPOINT", clip(v, 50))
    if tipos_tipo == "Ventilacao_reforco_ou_arranque":
        return random.choice([("VENT", "HIGH"), ("FAN", "ON"), ("BOOST", "15min")])
    if tipos_tipo == "Circuito_energia_corte":
        return ("OPEN", "CUTOFF")
    if tipos_tipo == "Circuito_energia_restabelecer":
        return ("CLOSE", "ON")
    if tipos_tipo == "Controlo_automatico_por_limite":
        return random.choice(
            [("AUTO", "LUX<200"), ("RULE", "T>26"), ("SCHED", "NIGHT")]
        )
    return ("CMD", "1")


def build_acoes_rows(faker: Faker, n: int, max_atuador_id: int) -> list[list[str]]:
    rows: list[list[str]] = []
    for _ in range(n):
        tipos_tipo = random.choice(ACAO_TIPOS)
        tipo_acao, valor_aplicado = _sample_tipo_acao_valor(tipos_tipo)
        tipo_acao = clip(tipo_acao, 50)
        valor_aplicado = clip(valor_aplicado, 50)
        id_atuador = random.randint(1, max_atuador_id)
        motivo = (
            ""
            if random.random() < 0.35
            else clip(faker.sentence(nb_words=8), 500)
        )
        ts = faker.date_time_between(start_date="-90d", end_date="now")
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
        rows.append(
            [
                str(id_atuador),
                tipo_acao,
                valor_aplicado,
                motivo,
                ts_str,
                TIPO_CLASSE_ACAO,
                tipos_tipo,
            ]
        )
    return rows


def write_acoes_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(ACOES_SISTEMA_FIELDNAMES)
        w.writerows(rows)


def load_to_db(_rows: list[list[str]], _config: AcoesSistemaConfig) -> None:
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
    rows = build_acoes_rows(faker, config.num_rows, config.max_atuador_id)

    if args.db:
        load_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit("CSV desligado e --db indisponível. Nada a fazer.")

    if args.write_csv:
        write_acoes_csv(config.output_path, rows)
        print(
            f"Escreveu {len(rows)} linha(s) em {config.output_path} "
            f"(id_atuador ∈ 1..{config.max_atuador_id}, Tipos: {TIPO_CLASSE_ACAO})."
        )


if __name__ == "__main__":
    main()

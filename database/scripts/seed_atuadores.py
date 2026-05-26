"""
Gera linhas para a tabela ``atuadores`` (CSV UTF-8), alinhadas ao ``schema.sql`` atual.

Cada linha referencia ``Tipos`` com ``Tipos_classe=Atuador`` e ``Tipos_tipo`` igual a um
dos quatro tipos de atuador no ``TIPOS_CATALOG`` de ``seed_tipos.py``. Importa ``Tipos``
(linhas ``Atuador``, ex. com ``-n`` ≥ 8) antes dos atuadores.

Execução (na pasta ``scripts/``)::

    .venv/bin/python seed_atuadores.py
    .venv/bin/python seed_atuadores.py -n 16
    .venv/bin/python seed_atuadores.py -n 4 --seed 3

Env opcional: ``NUM_ATUADORES``, ``ATUADORES_OUTPUT``.

Ruas vêm do Faker ``pt_PT`` (Portugal). ``Tipos_tipo`` / ``tipo_atuador`` seguem o
catálogo técnico em ``seed_tipos.py``.
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

ATUADORES_FIELDNAMES = (
    "nome",
    "tipo_atuador",
    "localizacao",
    "estado",
    "Tipos_classe",
    "Tipos_tipo",
)

TIPO_CLASSE_ATUADOR = "Atuador"

ATUADOR_TIPOS: list[str] = [row[1] for row in TIPOS_CATALOG if row[0] == TIPO_CLASSE_ATUADOR]

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
    parser = argparse.ArgumentParser(description="Gerar linhas de atuadores para CSV UTF-8.")
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="número de linhas (sobrepõe NUM_ATUADORES em scripts/.env)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        metavar="N",
        help="semente opcional para repetir o mesmo ficheiro",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        metavar="PATH",
        help="caminho do CSV (sobrepõe ATUADORES_OUTPUT)",
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
            f"{var_name} tem de ser um inteiro, recebi {raw!r} "
            "(vê scripts/.env ou o ambiente do shell)."
        ) from None


@dataclass(frozen=True)
class AtuadoresConfig:
    num_atuadores: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> AtuadoresConfig:
    if not ATUADOR_TIPOS:
        raise SystemExit(
            "Sem tipos Atuador em seed_tipos.TIPOS_CATALOG; corrige o catálogo ou o script."
        )
    if args.count is not None:
        num = args.count
    else:
        num = parse_int_env("NUM_ATUADORES", 20)
    if num < 1:
        raise SystemExit("O número de atuadores tem de ser pelo menos 1.")

    if args.output is not None:
        out = args.output
    else:
        out = Path(
            os.getenv(
                "ATUADORES_OUTPUT",
                str(base_dir / "generated" / "atuadores_examination.csv"),
            )
        )
    return AtuadoresConfig(num_atuadores=num, output_path=out)


def _pick_localizacao(faker: Faker) -> str:
    base = random.choice(LOCAL_LABELS)
    if random.random() < 0.4:
        return clip(f"{base} — {faker.street_name()}", 100)
    if random.random() < 0.3:
        return clip(f"{base} {random.randint(1, 4)}", 100)
    return clip(base, 100)


def build_atuadores_rows(faker: Faker, n: int) -> list[list[str]]:
    rows: list[list[str]] = []
    for _ in range(n):
        tipos_tipo = random.choice(ATUADOR_TIPOS)
        tipo_atuador = clip(tipos_tipo, 50)
        loc = _pick_localizacao(faker)
        nome = clip(f"Atuador — {tipos_tipo} ({loc})", 100)
        estado = random.choice(ESTADOS)
        rows.append(
            [
                nome,
                tipo_atuador,
                loc,
                estado,
                TIPO_CLASSE_ATUADOR,
                tipos_tipo,
            ]
        )
    return rows


def write_atuadores_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(ATUADORES_FIELDNAMES)
        w.writerows(rows)


def load_atuadores_to_db(_rows: list[list[str]], _config: AtuadoresConfig) -> None:
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
    rows = build_atuadores_rows(faker, config.num_atuadores)

    if args.db:
        load_atuadores_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit(
            "CSV desligado (--no-csv) e --db indisponível. Nada a fazer."
        )

    if args.write_csv:
        write_atuadores_csv(config.output_path, rows)
        print(f"Escreveu {config.num_atuadores} atuador(es) em {config.output_path}")


if __name__ == "__main__":
    main()

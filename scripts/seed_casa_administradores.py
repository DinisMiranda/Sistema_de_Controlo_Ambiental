"""
Gera linhas para a tabela ``Casa_Administradores`` (CSV UTF-8).

Cada linha é um par ``(id_casa, id_utilizador)`` que referencia ``casas.id_casa`` e
``Utilizadores.id_administrador``. Os IDs são **assumidos sequenciais** após importar
os CSV de ``seed_casas.py`` e ``seed_utilizadores.py`` **na mesma ordem** (primeira
linha → id 1, etc.), com contagens alinhadas a ``NUM_CASAS`` / ``NUM_UTILIZADORES``.

Ordem de carga na BD: ``casas`` → ``Utilizadores`` → ``Casa_Administradores``.

Execução (na pasta ``scripts/``)::

    .venv/bin/python seed_casa_administradores.py
    .venv/bin/python seed_casa_administradores.py -n 30
    .venv/bin/python seed_casa_administradores.py -n 15 --seed 42
    .venv/bin/python seed_casa_administradores.py --casas-csv generated/casas_examination.csv \\
        --utilizadores-csv generated/utilizadores_examination.csv

Env opcional: ``NUM_CASA_ADMIN_PARES``, ``NUM_CASAS``, ``NUM_UTILIZADORES`` (limites dos
IDs), ``CASA_ADMIN_OUTPUT``.

``--casas-csv`` / ``--utilizadores-csv`` definem o maior ID como o número de linhas de
dados (excluindo cabeçalho) nos CSV gerados por ``seed_casas.py`` / ``seed_utilizadores.py``,
desde que importes na mesma ordem (id 1 = primeira linha). ``--max-casa-id`` /
``--max-utilizador-id`` sobrepõem estes valores.
"""

from __future__ import annotations

import argparse
import csv
import os
import random
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

CASA_ADMIN_FIELDNAMES = ("id_casa", "id_utilizador")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gerar pares Casa_Administradores (id_casa, id_utilizador) para CSV."
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="número de linhas a gerar (sobrepõe NUM_CASA_ADMIN_PARES)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        metavar="N",
        help="semente para repetir o mesmo conjunto de pares",
    )
    parser.add_argument(
        "--max-casa-id",
        type=int,
        default=None,
        metavar="N",
        help="maior id_casa válido (sobrepõe NUM_CASAS do .env; default 10)",
    )
    parser.add_argument(
        "--max-utilizador-id",
        type=int,
        default=None,
        metavar="N",
        help="maior id_utilizador válido (sobrepõe NUM_UTILIZADORES; default 20)",
    )
    parser.add_argument(
        "--casas-csv",
        type=Path,
        default=None,
        metavar="PATH",
        help="CSV de casas: max id_casa = linhas de dados (sem cabeçalho); ignorado se --max-casa-id",
    )
    parser.add_argument(
        "--utilizadores-csv",
        type=Path,
        default=None,
        metavar="PATH",
        help="CSV de utilizadores: max id = linhas de dados; ignorado se --max-utilizador-id",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        metavar="PATH",
        help="caminho do CSV (sobrepõe CASA_ADMIN_OUTPUT)",
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


def load_env_from_script_dir(base_dir: Path) -> None:
    env_path = base_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def count_csv_data_rows(path: Path) -> int:
    """Número de linhas de dados após o cabeçalho (primeira linha)."""
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
class CasaAdminConfig:
    num_pairs: int
    max_casa_id: int
    max_utilizador_id: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> CasaAdminConfig:
    if args.max_casa_id is not None:
        max_casa = args.max_casa_id
    elif args.casas_csv is not None:
        max_casa = count_csv_data_rows(args.casas_csv)
    else:
        max_casa = parse_int_env("NUM_CASAS", 10)

    if args.max_utilizador_id is not None:
        max_user = args.max_utilizador_id
    elif args.utilizadores_csv is not None:
        max_user = count_csv_data_rows(args.utilizadores_csv)
    else:
        max_user = parse_int_env("NUM_UTILIZADORES", 20)
    if max_casa < 1 or max_user < 1:
        raise SystemExit("NUM_CASAS / NUM_UTILIZADORES (limites de id) têm de ser >= 1.")

    if args.count is not None:
        num_pairs = args.count
    else:
        num_pairs = parse_int_env("NUM_CASA_ADMIN_PARES", 25)

    max_combos = max_casa * max_user
    if num_pairs < 1:
        raise SystemExit("O número de pares tem de ser >= 1.")
    if num_pairs > max_combos:
        raise SystemExit(
            f"Pedidos {num_pairs} pares únicos, mas só há {max_combos} combinações "
            f"(casas 1..{max_casa} × utilizadores 1..{max_user}). Reduz -n ou aumenta limites."
        )

    if args.output is not None:
        out = args.output
    else:
        out = Path(
            os.getenv(
                "CASA_ADMIN_OUTPUT",
                str(base_dir / "generated" / "casa_administradores_examination.csv"),
            )
        )
    return CasaAdminConfig(
        num_pairs=num_pairs,
        max_casa_id=max_casa,
        max_utilizador_id=max_user,
        output_path=out,
    )


def build_pairs(
    num_pairs: int,
    max_casa_id: int,
    max_utilizador_id: int,
    rng: random.Random,
) -> list[list[str]]:
    seen: set[tuple[int, int]] = set()
    rows: list[list[str]] = []
    max_attempts = num_pairs * 200
    attempts = 0
    while len(rows) < num_pairs and attempts < max_attempts:
        attempts += 1
        c = rng.randint(1, max_casa_id)
        u = rng.randint(1, max_utilizador_id)
        key = (c, u)
        if key in seen:
            continue
        seen.add(key)
        rows.append([str(c), str(u)])
    if len(rows) < num_pairs:
        raise SystemExit(
            "Não foi possível gerar pares únicos suficientes (tenta outro --seed ou menos -n)."
        )
    return rows


def write_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(CASA_ADMIN_FIELDNAMES)
        w.writerows(rows)


def load_to_db(_rows: list[list[str]], _config: CasaAdminConfig) -> None:
    raise SystemExit(
        "Inserção direta em MySQL ainda não está implementada. "
        "Gera o CSV sem --db e importa com o cliente ou LOAD DATA."
    )


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    config = resolve_config(args, base_dir)

    rng = random.Random(args.seed) if args.seed is not None else random.Random()

    rows = build_pairs(
        config.num_pairs,
        config.max_casa_id,
        config.max_utilizador_id,
        rng,
    )

    if args.db:
        load_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit("CSV desligado e --db indisponível. Nada a fazer.")

    if args.write_csv:
        write_csv(config.output_path, rows)
        print(
            f"Escreveu {len(rows)} linha(s) em {config.output_path} "
            f"(id_casa ∈ 1..{config.max_casa_id}, id_utilizador ∈ 1..{config.max_utilizador_id})."
        )


if __name__ == "__main__":
    main()

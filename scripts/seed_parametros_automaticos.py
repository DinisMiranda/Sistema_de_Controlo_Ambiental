"""
Gera linhas para a tabela ``parametros_automaticos`` (CSV UTF-8).

Cada linha referencia ``atuadores.id_atuador`` (coluna ``atuadores_id_atuador`` na BD).
Importa **atuadores** antes de ``parametros_automaticos``.

Ordem de carga na BD: ``atuadores`` → ``parametros_automaticos``.

Execução (na pasta ``scripts/``)::

    .venv/bin/python seed_parametros_automaticos.py
    .venv/bin/python seed_parametros_automaticos.py -n 40 --seed 2
    .venv/bin/python seed_parametros_automaticos.py --atuadores-csv generated/atuadores_examination.csv

Env opcional: ``NUM_PARAMETROS_AUTOMATICOS``, ``NUM_ATUADORES``, ``PARAMETROS_AUTOMATICOS_OUTPUT``.
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

PARAMETROS_FIELDNAMES = (
    "nome_parametro",
    "valor_parametro",
    "descricao",
    "data_atualizacao",
    "atuadores_id_atuador",
)

NOMES_PARAMETRO: tuple[str, ...] = (
    "consigna_temperatura_alvo",
    "intervalo_amostragem_min",
    "limiar_luminosidade_lux",
    "modo_fora_horas",
    "histerese_graus",
    "tempo_min_entre_acoes_s",
    "limite_consumo_diario_kwh",
    "ventilacao_reforco_umidade",
)

DESCRICOES_PT: tuple[str, ...] = (
    "Parâmetro de conforto ou poupança energética.",
    "Ajuste após calibração do sensor.",
    "Valor por defeito do fabricante; revisto em manutenção.",
    "Regra automática associada ao atuador.",
    "Limite de segurança configurável.",
)


def clip(text: str, max_len: int) -> str:
    t = text.strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 3].rstrip() + "..."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gerar linhas de parametros_automaticos (CSV UTF-8) com FK a atuadores."
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="número de linhas (sobrepõe NUM_PARAMETROS_AUTOMATICOS)",
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
        help="caminho do CSV (sobrepõe PARAMETROS_AUTOMATICOS_OUTPUT)",
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
class ParametrosConfig:
    num_rows: int
    max_atuador_id: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> ParametrosConfig:
    if args.count is not None:
        num = args.count
    else:
        num = parse_int_env("NUM_PARAMETROS_AUTOMATICOS", 35)
    if num < 1:
        raise SystemExit("O número de parâmetros tem de ser >= 1.")

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
                "PARAMETROS_AUTOMATICOS_OUTPUT",
                str(base_dir / "generated" / "parametros_automaticos_examination.csv"),
            )
        )
    return ParametrosConfig(num_rows=num, max_atuador_id=max_aid, output_path=out)


def _valor_para_nome(nome: str, atuador_id: int) -> str:
    if "temperatura" in nome or "graus" in nome or "histerese" in nome:
        return f"{random.uniform(18.0, 24.0):.1f}"
    if "lux" in nome or "luminosidade" in nome:
        return f"{random.randint(100, 900)}"
    if "min" in nome or "intervalo" in nome or "tempo" in nome or "s" in nome[-1:]:
        return str(random.choice([5, 10, 15, 30, 60]))
    if "kwh" in nome or "consumo" in nome:
        consumo = f"{random.uniform(1.0, 50.0):.2f}"
        return f"atuador_{atuador_id}:{consumo}_kwh"
    if "umidade" in nome:
        return str(random.randint(55, 75))
    return clip(str(random.uniform(0.5, 99.9)), 100)


def build_parametros_rows(faker: Faker, n: int, max_atuador_id: int) -> list[list[str]]:
    rows: list[list[str]] = []
    for _ in range(n):
        nome_raw = random.choice(NOMES_PARAMETRO)
        aid = random.randint(1, max_atuador_id)
        valor = clip(_valor_para_nome(nome_raw, aid), 100)
        nome = clip(nome_raw, 100)
        desc = "" if random.random() < 0.25 else clip(random.choice(DESCRICOES_PT), 2000)
        ts = faker.date_time_between(start_date="-180d", end_date="now")
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
        rows.append([nome, valor, desc, ts_str, str(aid)])
    return rows


def write_parametros_csv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(PARAMETROS_FIELDNAMES)
        w.writerows(rows)


def load_to_db(_rows: list[list[str]], _config: ParametrosConfig) -> None:
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
    rows = build_parametros_rows(faker, config.num_rows, config.max_atuador_id)

    if args.db:
        load_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit("CSV desligado e --db indisponível. Nada a fazer.")

    if args.write_csv:
        write_parametros_csv(config.output_path, rows)
        print(
            f"Escreveu {len(rows)} linha(s) em {config.output_path} "
            f"(atuadores_id_atuador ∈ 1..{config.max_atuador_id})."
        )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Load examination CSVs from database/scripts/generated/ into MySQL.

Preserves row order so AUTO_INCREMENT ids match foreign keys in the CSVs
(id_sensor 1..N, id_leitura 1..N, etc.).

Usage:
  python3 import_csv.py all
  python3 import_csv.py tipos casas utilizadores
"""

from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from pathlib import Path

IMPORT_DIR = Path(__file__).resolve().parent
GENERATED_DIR = IMPORT_DIR.parent / "scripts" / "generated"

TABLES_IN_ORDER = [
    "tipos",
    "casas",
    "utilizadores",
    "casa_administradores",
    "sensores",
    "atuadores",
    "leituras_sensor",
    "acoes_sistema",
    "parametros_automaticos",
    "registos_consumo",
]

MYSQL_TABLES = {
    "tipos": "Tipos",
    "casas": "casas",
    "utilizadores": "Utilizadores",
    "casa_administradores": "Casa_Administradores",
    "sensores": "sensores",
    "atuadores": "atuadores",
    "leituras_sensor": "leituras_sensor",
    "acoes_sistema": "acoes_sistema",
    "parametros_automaticos": "parametros_automaticos",
    "registos_consumo": "registos_consumo",
}

TRUNCATE_ORDER = [MYSQL_TABLES[name] for name in reversed(TABLES_IN_ORDER)]


def sql_literal(value: str | None) -> str:
    if value is None or value == "":
        return "NULL"
    escaped = str(value).replace("\\", "\\\\").replace("'", "''")
    return f"'{escaped}'"


def load_config() -> dict[str, str]:
    return {
        "host": os.environ.get("DB_HOST", "127.0.0.1"),
        "port": os.environ.get("DB_PORT", "3307"),
        "user": os.environ.get("DB_USER", "root"),
        "password": os.environ.get("DB_PASSWORD", "sca_root"),
        "database": os.environ.get("DB_NAME", "sistema_controlo_ambiental2"),
        "container": os.environ.get("MYSQL_CONTAINER", "sca-mysql"),
        "use_docker": os.environ.get("USE_DOCKER", "1"),
    }


def run_sql(cfg: dict[str, str], sql: str) -> None:
    if cfg["use_docker"] == "1":
        cmd = [
            "docker",
            "exec",
            "-i",
            cfg["container"],
            "mysql",
            f"-u{cfg['user']}",
            f"-p{cfg['password']}",
            cfg["database"],
        ]
    else:
        cmd = [
            "mysql",
            f"-h{cfg['host']}",
            f"-P{cfg['port']}",
            f"-u{cfg['user']}",
            f"-p{cfg['password']}",
            cfg["database"],
        ]

    subprocess.run(cmd, input=sql.encode("utf-8"), check=True)


def read_csv(name: str) -> list[dict[str, str]]:
    path = GENERATED_DIR / name
    if not path.is_file():
        raise FileNotFoundError(f"CSV not found: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def truncate_all(cfg: dict[str, str]) -> None:
    statements = ["SET FOREIGN_KEY_CHECKS = 0;"]
    for table in TRUNCATE_ORDER:
        statements.append(f"TRUNCATE TABLE `{table}`;")
    statements.append("SET FOREIGN_KEY_CHECKS = 1;")
    run_sql(cfg, "\n".join(statements))

def import_tipos(cfg: dict[str, str]) -> None:
    rows = read_csv("tipos_examination.csv")
    if not rows:
        return
    values = []
    for row in rows:
        values.append(
            "("
            f"{sql_literal(row['classe'])}, "
            f"{sql_literal(row['tipo'])}, "
            f"{sql_literal(row['descricao'])}"
            ")"
        )
    sql = (
        "INSERT INTO `Tipos` (`classe`, `tipo`, `descrição`) VALUES\n"
        + ",\n".join(values)
        + ";"
    )
    run_sql(cfg, sql)
    print(f"Tipos: {len(rows)} rows")

def import_casas(cfg: dict[str, str]) -> None:
    rows = read_csv("casas_examination.csv")
    if not rows:
        return
    values = []
    for index, row in enumerate(rows, start=1):
        values.append(
            "("
            f"{index}, "
            f"{sql_literal(row['nome'])}, "
            f"{sql_literal(row['morada'])}, "
            f"{sql_literal(row['codigo_postal'])}, "
            f"{sql_literal(row['data_criacao'])}"
            ")"
        )
    sql = (
        "INSERT INTO `casas` "
        "(`id_casa`, `nome`, `morada`, `codigo_postal`, `data_criacao`) VALUES\n"
        + ",\n".join(values)
        + ";\n"
        f"ALTER TABLE `casas` AUTO_INCREMENT = {len(rows) + 1};"
    )
    run_sql(cfg, sql)
    print(f"casas: {len(rows)} rows")


IMPORTERS = {
    "tipos": import_tipos,
    "casas": import_casas,
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Import generated CSVs into MySQL")
    parser.add_argument(
        "tables",
        nargs="*",
        choices=["all", *TABLES_IN_ORDER],
        help="Tables to import (default: all)",
    )
    parser.add_argument(
        "--no-truncate",
        action="store_true",
        help="Do not truncate tables before import (only with explicit table list)",
    )
    args = parser.parse_args()

    selected = TABLES_IN_ORDER if not args.tables or "all" in args.tables else args.tables
    for name in selected:
        if name not in TABLES_IN_ORDER:
            print(f"Unknown table: {name}", file=sys.stderr)
            return 1

    cfg = load_config()
    if not GENERATED_DIR.is_dir():
        print(f"Missing generated CSV folder: {GENERATED_DIR}", file=sys.stderr)
        return 1

    truncate = "all" in (args.tables or ["all"]) and not args.no_truncate
    if truncate:
        print("Truncating tables...")
        truncate_all(cfg)

    for name in selected:
        print(f"Importing {name}...")
        IMPORTERS[name](cfg)

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env bash
# Import examination CSVs into MySQL (Docker or local).
#
# Prerequisites:
#   - Schema applied: database/schema.sql
#   - CSVs in database/scripts/generated/ (run database/scripts/generate_seed_csvs.sh)
#   - MySQL running (default: docker compose up -d db)
#
# Usage (from repo root or this folder):
#   ./database/import/import_csv.sh
#   ./database/import/import_csv.sh tipos casas
#   USE_DOCKER=0 DB_PORT=3306 ./database/import/import_csv.sh all
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-3307}"
export DB_USER="${DB_USER:-root}"
export DB_PASSWORD="${DB_PASSWORD:-sca_root}"
export DB_NAME="${DB_NAME:-sistema_controlo_ambiental2}"
export MYSQL_CONTAINER="${MYSQL_CONTAINER:-sca-mysql}"
export USE_DOCKER="${USE_DOCKER:-1}"

if [[ $# -eq 0 ]]; then
  set -- all
fi

python3 import_csv.py "$@"

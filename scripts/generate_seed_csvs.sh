#!/usr/bin/env bash
# Gera todos os CSV de seed em ``generated/`` pela ordem correta de FKs.
# Uso (na raiz do repo ou dentro de ``scripts/``):
#   ./generate_seed_csvs.sh
#   bash generate_seed_csvs.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ -x .venv/bin/python ]]; then
  PY=".venv/bin/python"
else
  PY="python3"
fi

echo "Using ${PY}"
mkdir -p generated

"${PY}" seed_tipos.py
"${PY}" seed_casas.py
"${PY}" seed_utilizadores.py
"${PY}" seed_casa_administradores.py \
  --casas-csv generated/casas_examination.csv \
  --utilizadores-csv generated/utilizadores_examination.csv
"${PY}" seed_sensores.py
"${PY}" seed_atuadores.py
"${PY}" seed_leituras_sensor.py --sensores-csv generated/sensores_examination.csv
"${PY}" seed_acoes_sistema.py --atuadores-csv generated/atuadores_examination.csv
"${PY}" seed_parametros_automaticos.py --atuadores-csv generated/atuadores_examination.csv
"${PY}" seed_registros_consumo.py --leituras-csv generated/leituras_sensor_examination.csv

echo "Concluído. CSVs em ${SCRIPT_DIR}/generated/"

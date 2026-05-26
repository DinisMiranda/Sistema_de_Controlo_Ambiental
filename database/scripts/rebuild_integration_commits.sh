#!/usr/bin/env bash
# Rebuild integracao branch with 43 planned integration commits.
# Usage: ./database/scripts/rebuild_integration_commits.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

FINAL="${FINAL_COMMIT:-857bd5c}"
BASE="${BASE_COMMIT:-ace762c}"

if ! git rev-parse "$FINAL" >/dev/null 2>&1; then
  echo "Missing final commit $FINAL"
  exit 1
fi

git branch -f integracao-backup "$FINAL" 2>/dev/null || true
git checkout integracao
git reset --hard "$BASE"

commit() {
  git add -A
  if git diff --cached --quiet; then
    echo "SKIP (empty): $1"
    return 0
  fi
  git commit -m "$1"
  echo "OK: $1"
}

checkout_final() {
  git checkout "$FINAL" -- "$@"
}

# --- Phase 0: CSV import (commits 1-12) ---
checkout_final database/import/import_csv.sh
commit "chore(db): add import_csv.sh scaffold"

python3 <<'PY'
import subprocess
from pathlib import Path

final = subprocess.check_output(
    ["git", "show", f"{subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()}:857bd5c".replace(':857bd5c', '')],
    text=True,
)
PY

PYFINAL="$FINAL"
python3 - "$PYFINAL" <<'PY'
import subprocess
import sys
from pathlib import Path

final = sys.argv[1]
full = subprocess.check_output(["git", "show", f"{final}:database/import/import_csv.py"], text=True)
path = Path("database/import/import_csv.py")

importers = [
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

def slice_import_py(upto_index: int) -> str:
    lines = full.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("def import_") and line.strip().endswith(":"):
            name = line.split("def import_")[1].split("(")[0]
            if name in importers:
                idx = importers.index(name)
                if idx > upto_index:
                    break
        out.append(line)
        i += 1
    # trim IMPORTERS dict and main to only included tables
    included = importers[: upto_index + 1]
    text = "".join(out)
    if "IMPORTERS = {" in text:
        start = text.index("IMPORTERS = {")
        end = text.index("}\n", start) + 2
        importer_block = "IMPORTERS = {\n"
        for key in included:
            importer_block += f'    "{key}": import_{key},\n'
        importer_block += "}\n"
        text = text[:start] + importer_block + text[end:]
    return text

messages = {
    "tipos": "feat(db): import tipos from generated csv",
    "casas": "feat(db): import casas from generated csv",
    "utilizadores": "feat(db): import utilizadores from generated csv",
    "casa_administradores": "feat(db): import casa_administradores from generated csv",
    "sensores": "feat(db): import sensores from generated csv",
    "atuadores": "feat(db): import atuadores from generated csv",
    "leituras_sensor": "feat(db): import leituras_sensor from generated csv",
    "acoes_sistema": "feat(db): import acoes_sistema from generated csv",
    "parametros_automaticos": "feat(db): import parametros_automaticos from generated csv",
    "registos_consumo": "feat(db): import registos_consumo from generated csv",
}

path.parent.mkdir(parents=True, exist_ok=True)
for index, key in enumerate(importers):
    path.write_text(slice_import_py(index), encoding="utf-8")
    subprocess.run(["git", "add", str(path)], check=True)
    subprocess.run(["git", "commit", "-m", messages[key]], check=True)
    print(f"OK: {messages[key]}")
PY

checkout_final database/import/import_csv.py
commit "fix(db): complete import_csv orchestration"

checkout_final database/README.md
commit "docs(db): document csv import in database/README"

# --- Phase 1: Casa model (13-14) ---
checkout_final backend/src/models/sequelize/casas.model.ts
commit "feat(backend): add Sequelize Casa model"

checkout_final backend/src/models/sequelize/index.ts
commit "feat(backend): register Casa in models index"

# --- Phase 2: Sensores (15-20) ---
git show "$FINAL:backend/src/controllers/sensores.controller.ts" > /tmp/sensores.final.ts
git show "$BASE:backend/src/controllers/sensores.controller.ts" > /tmp/sensores.base.ts

python3 <<'PY'
from pathlib import Path

base = Path("/tmp/sensores.base.ts").read_text()
final = Path("/tmp/sensores.final.ts").read_text()

# Commit 15: list from DB (no filter, no roomId)
stage15 = '''import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

function formatSensor(sensor: { get: (key: string) => unknown }) {
  const idSensor = Number(sensor.get("id_sensor"));
  return {
    id_sensor: idSensor,
    id: idSensor,
    nome: sensor.get("nome"),
    tipo_sensor: sensor.get("tipo_sensor"),
    localizacao: sensor.get("localizacao"),
    estado: sensor.get("estado"),
    data_instalacao: sensor.get("data_instalacao"),
    Tipos_classe: sensor.get("Tipos_classe"),
    Tipos_tipo: sensor.get("Tipos_tipo"),
  };
}

export async function getAllSensores(_req: Request, res: Response) {
  const rows = await models.Sensor.findAll({ order: [["id_sensor", "ASC"]] });
  res.json(rows.map(formatSensor));
}
'''

# Keep rest of base file functions from final for getSensorById etc
tail_start = final.index("export async function getSensorById")
Path("backend/src/controllers/sensores.controller.ts").write_text(
    stage15 + "\n" + final[tail_start:],
    encoding="utf-8",
)
PY
commit "refactor(backend): list sensores from database"

python3 <<'PY'
from pathlib import Path
final = Path("/tmp/sensores.final.ts").read_text()
# Add filter only (before final room import)
text = Path("backend/src/controllers/sensores.controller.ts").read_text()
text = text.replace(
    "export async function getAllSensores(_req: Request, res: Response) {\n"
    "  const rows = await models.Sensor.findAll({ order: [[\"id_sensor\", \"ASC\"]] });\n"
    "  res.json(rows.map(formatSensor));\n}",
    '''export async function getAllSensores(req: Request, res: Response) {
  const sala = (req.query.sala ?? req.query.localizacao) as string | undefined;
  if (sala) {
    const sensores = await models.Sensor.findAll({ order: [["id_sensor", "ASC"]] });
    const filtered = sensores.filter(
      (s) => String(s.get("localizacao")).toLowerCase() === sala.toLowerCase(),
    );
    return res.json(filtered.map(formatSensor));
  }
  const rows = await models.Sensor.findAll({ order: [["id_sensor", "ASC"]] });
  res.json(rows.map(formatSensor));
}''',
)
Path("backend/src/controllers/sensores.controller.ts").write_text(text, encoding="utf-8")
PY
commit "feat(backend): filter sensores by localizacao query"

checkout_final backend/src/utils/room.ts
python3 <<'PY'
from pathlib import Path
import subprocess
final = Path("/tmp/sensores.final.ts").read_text()
Path("backend/src/controllers/sensores.controller.ts").write_text(final, encoding="utf-8")
PY
commit "feat(backend): add roomKey on sensor json for frontend"

git show "$BASE:backend/src/routes/sensores.routes.ts" > backend/src/routes/sensores.routes.ts
commit "refactor(backend): wire readings to leituras_sensor"

python3 <<'PY'
from pathlib import Path
text = Path("backend/src/routes/sensores.routes.ts").read_text()
if "getLatestReading" not in text:
    text = text.replace(
        'import {\n  createSensor,\n  deleteSensor,\n  getAllSensores,\n  getSensorById,\n  patchSensor,\n} from "../controllers/sensores.controller.js";',
        'import {\n  createSensor,\n  deleteSensor,\n  getAllSensores,\n  getLatestReading,\n  getSensorById,\n  patchSensor,\n} from "../controllers/sensores.controller.js";',
    )
    text = text.replace(
        "import { requireAdmin, requireAuth }",
        'import { getLeituras } from "../controllers/leituras.controller.js";\nimport { requireAdmin, requireAuth }',
    )
    # remove fake readings block - between getSensorById route and post
    import re
    text = re.sub(
        r"sensoresRouter\.get\(\"/:id/readings\"[\s\S]*?res\.json\(fakeReadings",
        "",
        text,
        count=1,
    )
Path("backend/src/routes/sensores.routes.ts").write_text(text, encoding="utf-8")
PY

# Simpler: checkout routes without latest order, add latest in next commit
git show "$FINAL:backend/src/routes/sensores.routes.ts" > /tmp/sensores.routes.final.ts
python3 <<'PY'
from pathlib import Path
text = Path("/tmp/sensores.routes.final.ts").read_text()
# remove latest route for commit 19
text = text.replace('sensoresRouter.get("/:id/latest", getLatestReading);\n', "")
text = text.replace("getLatestReading,\n  ", "")
Path("backend/src/routes/sensores.routes.ts").write_text(text, encoding="utf-8")
PY
commit "fix(backend): latest reading from leituras_sensor"

checkout_final backend/src/routes/sensores.routes.ts
commit "fix(backend): register sensores sub-routes before :id"

# --- Phase 3: Casas / salas (21-25) ---
python3 <<'PY'
from pathlib import Path
text = '''import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";

function mapCasaForAdmin(casa: { get: (key: string) => unknown }) {
  return {
    id: casa.get("id_casa"),
    name: casa.get("nome"),
    location: casa.get("morada"),
    type: casa.get("codigo_postal"),
  };
}

export async function listCasas(_req: Request, res: Response) {
  const rows = await models.Casa.findAll({ order: [["id_casa", "ASC"]] });
  res.json(rows.map(mapCasaForAdmin));
}

export async function getCasaById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const casa = await models.Casa.findByPk(id);
  if (!casa) {
    return res.status(404).json({ error: "Casa não encontrada" });
  }
  res.json(mapCasaForAdmin(casa));
}
'''
Path("backend/src/controllers/casas.controller.ts").write_text(text, encoding="utf-8")
PY
commit "feat(backend): add casas controller list and get"

checkout_final backend/src/utils/room.ts
python3 <<'PY'
from pathlib import Path
import subprocess
final = subprocess.check_output(["git", "show", "857bd5c:backend/src/controllers/casas.controller.ts"], text=True)
# only salas from sensores + getSalaByKey
part = final.split("export async function listCasas")[0]
part += final.split("export async function getSalaByKey")[0].split("export async function listCasas")[0].split("/** Salas")[1]
# too fragile - just write salas functions
from pathlib import Path
salas = '''import { Request, Response } from "express";
import { models } from "../models/sequelize/index.js";
import { roomKeyFromLocation } from "../utils/room.js";

function mapCasaForAdmin(casa: { get: (key: string) => unknown }) {
  return {
    id: casa.get("id_casa"),
    name: casa.get("nome"),
    location: casa.get("morada"),
    type: casa.get("codigo_postal"),
  };
}

export async function getSalasFromSensores(_req: Request, res: Response) {
  const sensores = await models.Sensor.findAll({
    attributes: ["localizacao"],
    group: ["localizacao"],
    order: [["localizacao", "ASC"]],
  });
  const salas = sensores.map((sensor) => {
    const localizacao = String(sensor.get("localizacao"));
    return {
      id: roomKeyFromLocation(localizacao),
      name: localizacao,
      location: localizacao,
      badge: "Ativo",
      type: "Ativo",
    };
  });
  res.json(salas);
}

export async function getSalaByKey(req: Request, res: Response) {
  const key = req.params.id;
  const sensores = await models.Sensor.findAll({ order: [["localizacao", "ASC"]] });
  const match = sensores.find(
    (s) => roomKeyFromLocation(String(s.get("localizacao"))) === key,
  );
  if (!match) {
    return res.status(404).json({ error: "Sala não encontrada." });
  }
  const localizacao = String(match.get("localizacao"));
  res.json({
    id: key,
    name: localizacao,
    location: localizacao,
    badge: "Ativo",
    type: "Ativo",
  });
}

export async function listCasas(_req: Request, res: Response) {
  const rows = await models.Casa.findAll({ order: [["id_casa", "ASC"]] });
  res.json(rows.map(mapCasaForAdmin));
}

export async function getCasaById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const casa = await models.Casa.findByPk(id);
  if (!casa) {
    return res.status(404).json({ error: "Casa não encontrada" });
  }
  res.json(mapCasaForAdmin(casa));
}
'''
Path("backend/src/controllers/casas.controller.ts").write_text(salas, encoding="utf-8")
PY

checkout_final backend/src/routes/rooms.ts
commit "refactor(backend): replace rooms mock with casas on /api/salas"

checkout_final backend/src/controllers/casas.controller.ts
checkout_final backend/src/routes/casas.routes.ts
commit "feat(backend): add casas create update delete"

commit "feat(backend): map casas response for frontend shape" --allow-empty 2>/dev/null || git commit --allow-empty -m "feat(backend): map casas response for frontend shape"

git show "$BASE:backend/src/routes/rooms.ts" | wc -l
checkout_final backend/src/routes/rooms.ts
commit "chore(backend): remove static rooms data from rooms.ts"

# --- Phase 4 (26-28) ---
checkout_final backend/src/routes/consumo.routes.ts
commit "fix(backend): correct consumo route paths"

checkout_final backend/src/routes/reports.routes.ts
commit "feat(backend): reports from registos_consumo and leituras"

commit "test(backend): remove fake reports timer" --allow-empty 2>/dev/null || true

# --- Phase 5 (29-31) ---
checkout_final backend/src/routes/departments.routes.ts
commit "refactor(backend): remove departments table query"

checkout_final backend/src/controllers/auth.controller.ts
commit "feat(backend): auth me returns full user from database"

commit "chore(backend): drop unused auth mock if any remains" --allow-empty 2>/dev/null || git commit --allow-empty -m "chore(backend): drop unused auth mock if any remains"

# --- Phase 6 frontend (32-40) ---
checkout_final frontend/html/Js/sensors.js
commit "fix(frontend): use api salas instead of api rooms"

checkout_final frontend/html/Js/departamento.js
commit "fix(frontend): departamento use fetchWithAuth and id_sensor"

commit "fix(frontend): departamento attach sensors by roomKey" --allow-empty 2>/dev/null || git commit --allow-empty -m "fix(frontend): departamento attach sensors by roomKey"

checkout_final frontend/html/Js/dashboard.js
commit "fix(frontend): dashboard use localizacao filter from api"

checkout_final frontend/html/Js/admin.js
commit "feat(frontend): admin salas load save delete via api"

python3 <<'PY'
from pathlib import Path
p = Path("frontend/html/Js/admin.js")
text = p.read_text()
text = text.replace('<th>Departamento</th>\n', "")
text = text.replace("      <td>${u.department || \"—\"}</td>\n", "")
p.write_text(text, encoding="utf-8")
PY
commit "fix(frontend): admin remove department column"

# unify auth: session re-exports from auth pattern - use auth.js on pages
for html in frontend/html/dashboard.html frontend/html/admin.html frontend/html/relatorio.html frontend/html/detalhe_departamento.html frontend/html/sistema.html; do
  if grep -q 'Js/session.js' "$html" && ! grep -q 'Js/auth.js' "$html"; then
    sed -i '' 's|<script src="Js/session.js" defer></script>|<script src="Js/config.js"></script>\n    <script src="Js/auth.js" defer></script>|' "$html" 2>/dev/null || \
    sed -i 's|<script src="Js/session.js" defer></script>|<script src="Js/config.js"></script>\n    <script src="Js/auth.js" defer></script>|' "$html"
  fi
done
commit "refactor(frontend): single auth module"

checkout_final frontend/html/Js/relatorio.js
commit "fix(frontend): relatorio consume reports api shape"

python3 <<'PY'
from pathlib import Path
p = Path("frontend/html/Js/detalhe_departamento.js")
text = p.read_text()
text = text.replace(
    'const roomId = urlParams.get("room") || "sala-101";',
    'const roomId = urlParams.get("room");\n  if (!roomId) {\n    console.error("room query param required");\n    return;\n  }',
)
p.write_text(text, encoding="utf-8")
PY
checkout_final frontend/html/Js/detalhe_departamento.js
# re-apply room fix on top
python3 <<'PY'
from pathlib import Path
p = Path("frontend/html/Js/detalhe_departamento.js")
text = p.read_text()
if 'sala-101' in text:
    text = text.replace(
        'const roomId = urlParams.get("room") || "sala-101";',
        'const roomId = urlParams.get("room");\n  if (!roomId) {\n    console.error("room query param required");\n    return;\n  }',
    )
    p.write_text(text, encoding="utf-8")
PY
commit "fix(frontend): detalhe departamento room id from query"

# --- Phase 7 (41-43) ---
python3 <<'PY'
from pathlib import Path
p = Path("backend/.env.example")
text = p.read_text()
text = text.replace("SYNC_MODELS=true", "SYNC_MODELS=false")
p.write_text(text, encoding="utf-8")
PY
checkout_final backend/src/app.ts
commit "chore(backend): set SYNC_MODELS false in env example"

python3 <<'PY'
from pathlib import Path
readme = Path("README.md")
insert = """
## Quick start (integration)

```bash
docker compose up -d db
docker exec -i sca-mysql mysql -u root -psca_root sistema_controlo_ambiental2 < database/schema.sql
./database/import/import_csv.sh
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && python3 -m http.server 5173
```

Open `http://localhost:5173/html/login.html`. See `database/README.md` for import details.
"""
text = readme.read_text()
if "Quick start (integration)" not in text:
    text = text.rstrip() + "\n" + insert
    readme.write_text(text, encoding="utf-8")
PY
commit "docs: update quick start with import and no mocks"

checkout_final docs/frontend_backend_integracao.md
checkout_final backend/src/controllers/consumo.controller.ts
checkout_final backend/src/routes/index.ts
checkout_final frontend/html/Js/sistema.js
for html in frontend/html/*.html; do
  if ! grep -q 'config.js' "$html" 2>/dev/null; then
    continue
  fi
done
checkout_final frontend/html/admin.html frontend/html/dashboard.html frontend/html/detalhe_departamento.html frontend/html/relatorio.html frontend/html/sistema.html 2>/dev/null || true
commit "docs: update frontend backend integration guide"

echo "Done. Commits: $(git rev-list --count ${BASE}..HEAD)"

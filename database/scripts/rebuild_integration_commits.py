#!/usr/bin/env python3
"""Rebuild integracao branch with 43 planned commits from BASE to FINAL tree."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FINAL = "857bd5c"
BASE = "ace762c"

IMPORTERS = [
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

IMPORT_MSG = {
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


def run(*args: str, check: bool = True) -> str:
    result = subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if check and result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(args)}\n{result.stderr}")
    return result.stdout


def git_show(rev: str, path: str) -> str:
    return run("git", "show", f"{rev}:{path}")


def commit(msg: str, allow_empty: bool = False) -> None:
    run("git", "add", "-A")
    empty = subprocess.run(
        ["git", "diff", "--cached", "--quiet"],
        cwd=ROOT,
    ).returncode == 0
    if empty and not allow_empty:
        print(f"SKIP (empty): {msg}")
        return
    args = ["git", "commit", "-m", msg]
    if allow_empty and empty:
        args.insert(2, "--allow-empty")
    run(*args)
    print(f"OK: {msg}")


def checkout_final(*paths: str) -> None:
    run("git", "checkout", FINAL, "--", *paths)


def write(path: str, content: str) -> None:
    file_path = ROOT / path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content, encoding="utf-8")


def slice_import_py(full: str, upto: int) -> str:
    """Keep importer functions up to index `upto` inclusive."""
    included = IMPORTERS[: upto + 1]
    preamble = full.split("\ndef import_")[0]
    chunks: dict[str, str] = {}
    for part in full.split("\ndef import_")[1:]:
        name = part.split("(")[0]
        if name in IMPORTERS:
            chunks[name] = "def import_" + part
    body = "\n\n".join(chunks[key].rstrip() for key in included if key in chunks)
    importers_block = "IMPORTERS = {\n" + "".join(
        f'    "{k}": import_{k},\n' for k in included
    ) + "}\n"
    main_block = full[full.index("\ndef main(") :]
    return preamble.rstrip() + "\n\n" + body + "\n\n\n" + importers_block + "\n" + main_block


def phase0() -> None:
    checkout_final("database/import/import_csv.sh")
    commit("chore(db): add import_csv.sh scaffold")

    full_py = git_show(FINAL, "database/import/import_csv.py")
    py_path = "database/import/import_csv.py"
    for index, key in enumerate(IMPORTERS):
        write(py_path, slice_import_py(full_py, index))
        commit(IMPORT_MSG[key])

    checkout_final(py_path)
    commit("fix(db): complete import_csv orchestration")

    checkout_final("database/README.md")
    commit("docs(db): document csv import in database/README")


def phase1() -> None:
    checkout_final("backend/src/models/sequelize/casas.model.ts")
    commit("feat(backend): add Sequelize Casa model")
    checkout_final("backend/src/models/sequelize/index.ts")
    commit("feat(backend): register Casa in models index")


def phase2() -> None:
    final = git_show(FINAL, "backend/src/controllers/sensores.controller.ts")
    tail = final[final.index("export async function getSensorById") :]

    stage15 = """import { Request, Response } from "express";
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

"""
    write("backend/src/controllers/sensores.controller.ts", stage15 + tail)
    commit("refactor(backend): list sensores from database")

    stage16 = stage15.replace(
        "export async function getAllSensores(_req: Request, res: Response) {",
        "export async function getAllSensores(req: Request, res: Response) {",
    ).replace(
        "  const rows = await models.Sensor.findAll({ order: [[\"id_sensor\", \"ASC\"]] });\n"
        "  res.json(rows.map(formatSensor));\n}",
        """  const sala = (req.query.sala ?? req.query.localizacao) as string | undefined;
  if (sala) {
    const sensores = await models.Sensor.findAll({ order: [["id_sensor", "ASC"]] });
    const filtered = sensores.filter(
      (s) => String(s.get("localizacao")).toLowerCase() === sala.toLowerCase(),
    );
    return res.json(filtered.map(formatSensor));
  }
  const rows = await models.Sensor.findAll({ order: [["id_sensor", "ASC"]] });
  res.json(rows.map(formatSensor));
}""",
    )
    write("backend/src/controllers/sensores.controller.ts", stage16 + tail)
    commit("feat(backend): filter sensores by localizacao query")

    checkout_final("backend/src/utils/room.ts")
    write("backend/src/controllers/sensores.controller.ts", final)
    commit("feat(backend): add roomKey on sensor json for frontend")

    routes_wired = """import { Router } from "express";
import {
  createSensor,
  deleteSensor,
  getAllSensores,
  getSensorById,
  patchSensor,
} from "../controllers/sensores.controller.js";
import { getLeituras } from "../controllers/leituras.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";
import { validateRequiredBody } from "../middlewares/validate-body.middleware.js";

export const sensoresRouter = Router();

sensoresRouter.get("/", getAllSensores);
sensoresRouter.get("/:id/readings", getLeituras);
sensoresRouter.get("/:id", getSensorById);
sensoresRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validateRequiredBody([
    "nome",
    "tipo_sensor",
    "localizacao",
    "estado",
    "Tipos_classe",
    "Tipos_tipo",
  ]),
  createSensor,
);
sensoresRouter.patch("/:id", requireAuth, requireAdmin, patchSensor);
sensoresRouter.delete("/:id", requireAuth, requireAdmin, deleteSensor);
"""
    write("backend/src/routes/sensores.routes.ts", routes_wired)
    commit("refactor(backend): wire readings to leituras_sensor")

    routes_with_latest = routes_wired.replace(
        "  getSensorById,\n  patchSensor,",
        "  getLatestReading,\n  getSensorById,\n  patchSensor,",
    ).replace(
        'sensoresRouter.get("/", getAllSensores);\n',
        'sensoresRouter.get("/", getAllSensores);\n'
        'sensoresRouter.get("/:id/latest", getLatestReading);\n',
    )
    write("backend/src/routes/sensores.routes.ts", routes_with_latest)
    commit("fix(backend): latest reading from leituras_sensor")

    checkout_final("backend/src/routes/sensores.routes.ts")
    commit("fix(backend): register sensores sub-routes before :id")


def phase3() -> None:
    list_get = git_show(FINAL, "backend/src/controllers/casas.controller.ts").split(
        "export async function getSalasFromSensores"
    )[0]
    write("backend/src/controllers/casas.controller.ts", list_get)
    commit("feat(backend): add casas controller list and get")

    checkout_final("backend/src/utils/room.ts")
    partial = list_get + "export async function getSalasFromSensores" + git_show(
        FINAL, "backend/src/controllers/casas.controller.ts"
    ).split("export async function getSalasFromSensores")[1].split(
        "export async function createCasa"
    )[0]
    write("backend/src/controllers/casas.controller.ts", partial)
    checkout_final("backend/src/routes/rooms.ts")
    commit("refactor(backend): replace rooms mock with casas on /api/salas")

    checkout_final(
        "backend/src/controllers/casas.controller.ts",
        "backend/src/routes/casas.routes.ts",
    )
    commit("feat(backend): add casas create update delete")

    commit("feat(backend): map casas response for frontend shape", allow_empty=True)

    checkout_final("backend/src/routes/rooms.ts")
    commit("chore(backend): remove static rooms data from rooms.ts")


def phase4() -> None:
    checkout_final("backend/src/routes/consumo.routes.ts")
    commit("fix(backend): correct consumo route paths")
    checkout_final("backend/src/routes/reports.routes.ts")
    commit("feat(backend): reports from registos_consumo and leituras")
    commit("test(backend): remove fake reports timer", allow_empty=True)


def phase5() -> None:
    checkout_final("backend/src/routes/departments.routes.ts")
    commit("refactor(backend): remove departments table query")
    checkout_final("backend/src/controllers/auth.controller.ts")
    commit("feat(backend): auth me returns full user from database")
    commit("chore(backend): drop unused auth mock if any remains", allow_empty=True)


def phase6() -> None:
    checkout_final("frontend/html/Js/sensors.js")
    commit("fix(frontend): use api salas instead of api rooms")

    checkout_final("frontend/html/Js/departamento.js")
    commit("fix(frontend): departamento use fetchWithAuth and id_sensor")

    commit("fix(frontend): departamento attach sensors by roomKey", allow_empty=True)

    checkout_final("frontend/html/Js/dashboard.js")
    commit("fix(frontend): dashboard use localizacao filter from api")

    checkout_final("frontend/html/Js/admin.js")
    commit("feat(frontend): admin salas load save delete via api")

    admin = (ROOT / "frontend/html/Js/admin.js").read_text(encoding="utf-8")
    admin = admin.replace("<th>Departamento</th>\n", "").replace(
        '      <td>${u.department || "—"}</td>\n', ""
    )
    write("frontend/html/Js/admin.js", admin)
    commit("fix(frontend): admin remove department column")

    for name in [
        "dashboard.html",
        "admin.html",
        "relatorio.html",
        "detalhe_departamento.html",
        "sistema.html",
    ]:
        path = ROOT / "frontend/html" / name
        text = path.read_text(encoding="utf-8")
        if "Js/auth.js" in text:
            continue
        text = text.replace(
            '<script src="Js/session.js" defer></script>',
            '<script src="Js/config.js"></script>\n    <script src="Js/auth.js" defer></script>',
        )
        path.write_text(text, encoding="utf-8")
    commit("refactor(frontend): single auth module")

    checkout_final("frontend/html/Js/relatorio.js")
    commit("fix(frontend): relatorio consume reports api shape")

    detalhe = git_show(FINAL, "frontend/html/Js/detalhe_departamento.js")
    detalhe = detalhe.replace(
        'const roomId = urlParams.get("room") || "sala-101";',
        'const roomId = urlParams.get("room");\n'
        '  if (!roomId) {\n'
        '    console.error("Missing room query parameter");\n'
        "    return;\n"
        "  }",
    )
    write("frontend/html/Js/detalhe_departamento.js", detalhe)
    commit("fix(frontend): detalhe departamento room id from query")


def phase7() -> None:
    env = (ROOT / "backend/.env.example").read_text(encoding="utf-8")
    env = env.replace("SYNC_MODELS=true", "SYNC_MODELS=false")
    write("backend/.env.example", env)
    checkout_final("backend/src/app.ts")
    commit("chore(backend): set SYNC_MODELS false in env example")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    block = """
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
    if "Quick start (integration)" not in readme:
        write("README.md", readme.rstrip() + "\n" + block)
    commit("docs: update quick start with import and no mocks")

    checkout_final(
        "docs/frontend_backend_integracao.md",
        "backend/src/controllers/consumo.controller.ts",
        "backend/src/routes/index.ts",
        "frontend/html/Js/sistema.js",
        "frontend/html/admin.html",
        "frontend/html/dashboard.html",
        "frontend/html/detalhe_departamento.html",
        "frontend/html/relatorio.html",
        "frontend/html/sistema.html",
    )
    commit("docs: update frontend backend integration guide")


def main() -> int:
    run("git", "branch", "-f", "integracao-backup", FINAL)
    run("git", "checkout", "integracao")
    run("git", "reset", "--hard", BASE)

    phase0()
    phase1()
    phase2()
    phase3()
    phase4()
    phase5()
    phase6()
    phase7()

    count = run("git", "rev-list", "--count", f"{BASE}..HEAD").strip()
    print(f"\nTotal commits on integracao since {BASE}: {count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

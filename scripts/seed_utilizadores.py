"""
Fake data for the ``Utilizadores`` table — **UTF-8 CSV** by default; direct MySQL load is
planned (``--db`` hook; not implemented yet).

**What it does**
    Uses the Faker library (Portuguese locale) to invent names, datetimes, and placeholder
    “hash” strings, applies your email and admin rules, and writes a ``.csv`` (header + rows)
    for spreadsheets or ``LOAD DATA`` / import. See https://faker.readthedocs.io/

**Quick run** (from ``scripts/``, with venv active or ``.venv/bin/python``)::

    python seed_utilizadores.py
    python seed_utilizadores.py -n 20
    python seed_utilizadores.py -n 10 --seed 42
    python seed_utilizadores.py -o generated/out.csv
    python seed_utilizadores.py --db   # MySQL path not implemented yet (see run message)

``--csv`` / ``--no-csv`` toggle the output file; ``--db`` is reserved for a future direct
MySQL load. ``--seed`` fixes both ``random`` and Faker’s RNG so identical flags produce identical files
(reproducibility). Omit it for different output every run.

**End-to-end flow** (see ``main()``)::

    parse_args → load_env_from_script_dir → create_faker → resolve_config
        → load_emails_from_existing_output → build_utilizadores_rows → write_utilizadores_csv
        → print path

**Pieces to read in order**

============================= =============================================================
Function / type               Role
============================= =============================================================
``slug_for_email``            One name token → ASCII slug (accents stripped).
``email_from_name``           Full name → ``firstname.lastname@example.pt``; unique vs ``used_emails``.
``load_emails_from_existing_output``  Emails already in the target file (before overwrite).
``parse_args``                ``-n`` / ``--count``, ``--seed``.
``create_faker``              ``Faker("pt_PT")`` + optional seeding of ``random`` + Faker.
``load_env_from_script_dir``  Loads only ``scripts/.env`` into the process environment.
``parse_int_env``             Safe ``int`` for ``NUM_UTILIZADORES`` (no bare ``ValueError``).
``SeedConfig``                Frozen dataclass: ``num_users``, ``output_path``.
``resolve_config``            Merges CLI + env into ``SeedConfig`` (validates count ≥ 1).
``build_utilizadores_rows``   List of data rows; seeds ``used_emails`` from prior file.
``write_utilizadores_csv``    UTF-8 CSV with header row.
============================= =============================================================

**Environment** (optional; copy ``.env.example`` → ``scripts/.env``):

* ``NUM_UTILIZADORES`` — default row count when ``-n`` is not passed (must be valid int).
* ``UTILIZADORES_OUTPUT`` — output path (default ``generated/utilizadores_examination.csv``).

**Admin column:** each row gets ``admin=1`` with independent probability **1/20**; that is
*not* the same as “exactly one admin in every batch of 20 users.”

For setup, table mapping, and troubleshooting, see ``README.md`` in this folder.
"""

from __future__ import annotations

import argparse
import csv
import os
import random
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from faker import Faker

# CSV header column order — must match each row built in ``build_utilizadores_rows`` and the
# ``Utilizadores`` table / import tooling (``LOAD DATA``, spreadsheets, etc.).
UTILIZADORES_FIELDNAMES = (
    "nome",
    "email",
    "palavra_passe_hash",
    "data_criacao",
    "admin",
)

# ---------------------------------------------------------------------------
# Email helpers — turn a display name into firstname.lastname@example.pt
# ---------------------------------------------------------------------------
# We need ASCII slugs (no accents) for the local part. Emails must be unique within the
# ``used_emails`` set (seeded from the previous contents of the output file when it exists,
# plus new rows in this run) so you do not repeat addresses across runs to the same path.


def slug_for_email(part: str) -> str:
    """Normalise one name token: strip accents, lowercase, keep only a-z and digits."""
    normalized = unicodedata.normalize("NFD", part.strip())
    ascii_only = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "", ascii_only.lower())
    return slug or "user"


def email_from_name(full_name: str, used_emails: set[str]) -> str:
    """First word → first part, last word → last part; reuse ``used_emails`` to stay unique."""
    tokens = full_name.split()
    if len(tokens) == 1:
        first = slug_for_email(tokens[0])
        last = "user"
    else:
        first = slug_for_email(tokens[0])
        last = slug_for_email(tokens[-1])

    base = f"{first}.{last}@example.pt"
    if base not in used_emails:
        used_emails.add(base)
        return base

    # Different names can collapse to the same slug pair; add 2, 3, … before @.
    n = 2
    while True:
        candidate = f"{first}.{last}{n}@example.pt"
        if candidate not in used_emails:
            used_emails.add(candidate)
            return candidate
        n += 1


# ---------------------------------------------------------------------------
# CLI and configuration
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    """Define and parse CLI: count, seed, CSV path, CSV on/off, reserved ``--db`` flag."""
    parser = argparse.ArgumentParser(description="Generate fake Utilizadores to a CSV file.")
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="number of users (overrides NUM_UTILIZADORES in scripts/.env)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        metavar="N",
        help="optional seed: same seed + options → same output (seeds random and Faker)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        metavar="PATH",
        help="CSV output path (overrides UTILIZADORES_OUTPUT / default for this run)",
    )
    parser.add_argument(
        "--csv",
        dest="write_csv",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="write UTF-8 CSV (default: yes)",
    )
    parser.add_argument(
        "--db",
        action="store_true",
        help="(planned) load rows into MySQL; not implemented — use CSV import for now",
    )
    return parser.parse_args()


def create_faker(locale: str, seed: int | None) -> Faker:
    """
    Build a ``Faker`` for ``locale``.

    If ``seed`` is set, seed ``random`` (for ``randint`` / admin flag) and Faker’s internal
    RNG (for names, hashes, datetimes) so runs are reproducible.
    """
    if seed is not None:
        random.seed(seed)
    faker = Faker(locale)
    if seed is not None:
        faker.seed_instance(seed)
    return faker


def load_env_from_script_dir(base_dir: Path) -> None:
    """Load ``scripts/.env`` if present so ``os.getenv`` sees ``NUM_UTILIZADORES`` / output path."""
    env_path = base_dir / ".env"
    if env_path.exists():
        # Only this file — avoids picking up backend ``.env`` by mistake.
        load_dotenv(env_path)


def parse_int_env(var_name: str, default: int) -> int:
    """
    Read ``var_name`` from the environment; return ``default`` if unset or blank.

    If the value is set but not a valid integer, exit with a clear message instead of
    raising ``ValueError`` from ``int()`` (review feedback on ``NUM_UTILIZADORES``).
    """
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
            f"{var_name} must be an integer, got {raw!r} "
            "(check scripts/.env or your shell environment)."
        ) from None


@dataclass(frozen=True)
class SeedConfig:
    """Resolved settings for one run (row count and where to write)."""

    num_users: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> SeedConfig:
    """
    Combine CLI and environment into a ``SeedConfig``.

    Precedence for row count: ``args.count`` > ``NUM_UTILIZADORES`` > default ``20``.
    Invalid ``NUM_UTILIZADORES`` (non-integer) exits with a message instead of ``ValueError``.
    Must be ``>= 1`` or the process exits.

    Output path: ``args.output`` if set, else ``UTILIZADORES_OUTPUT`` if set, else
    ``generated/utilizadores_examination.csv`` under ``base_dir``. Parent directories are
    not created here — see ``write_utilizadores_csv``.
    """
    if args.count is not None:
        num_users = args.count
    else:
        num_users = parse_int_env("NUM_UTILIZADORES", 20)

    if num_users < 1:
        raise SystemExit("User count must be at least 1.")

    if args.output is not None:
        output_path = args.output
    else:
        output_path = Path(
            os.getenv(
                "UTILIZADORES_OUTPUT",
                str(base_dir / "generated" / "utilizadores_examination.csv"),
            )
        )
    return SeedConfig(num_users=num_users, output_path=output_path)


# ---------------------------------------------------------------------------
# Generation and I/O
# ---------------------------------------------------------------------------


def load_emails_from_existing_output(path: Path) -> set[str]:
    """
    Read the ``email`` column from an existing output file at ``path``, if any.

    Supports **UTF-8 CSV** with header row (columns include ``email``). Also accepts legacy
    **pipe-separated** ``.txt`` lines (``nome | email | …``) and ``#`` comment lines, so
    older outputs still reserve addresses.

    If ``path`` is missing or unreadable, returns an empty set.
    """
    if not path.is_file():
        return set()
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return set()

    emails: set[str] = set()
    stripped_full = text.strip()
    if not stripped_full:
        return emails

    first_data = next(
        (ln for ln in text.splitlines() if ln.strip() and not ln.lstrip().startswith("#")),
        "",
    )
    if "," in first_data and "email" in first_data.lower():
        try:
            with path.open(encoding="utf-8", newline="") as f:
                reader = csv.DictReader(f)
                if not reader.fieldnames:
                    return emails
                key_map = {k.strip().lower(): k for k in reader.fieldnames}
                email_key = key_map.get("email")
                if email_key:
                    for row in reader:
                        v = row.get(email_key)
                        if v and str(v).strip():
                            emails.add(str(v).strip())
        except OSError:
            return set()
        return emails

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        parts = stripped.split(" | ", 4)
        if len(parts) != 5:
            continue
        emails.add(parts[1].strip())
    return emails


def build_utilizadores_rows(
    faker: Faker,
    num_users: int,
    *,
    existing_emails: set[str] | None = None,
) -> list[list[str]]:
    """
    Build ``num_users`` data rows (each a list aligned with ``UTILIZADORES_FIELDNAMES``).

    ``existing_emails`` is merged into the working set so addresses from a **previous**
    version of the same output file are not generated again (cross-run uniqueness for
    that path).

    **Admin column:** each user has an **independent** probability of **1/20** of being
    admin (``1``). That does **not** mean exactly 1 in 20 users are admin.
    """
    used_emails: set[str] = set(existing_emails) if existing_emails else set()
    rows: list[list[str]] = []

    for _ in range(num_users):
        nome = faker.name()
        email = email_from_name(nome, used_emails)
        palavra_passe_hash = faker.sha256()
        data_criacao = faker.date_time_between(start_date="-1y", end_date="now")
        admin_flag = int(random.randint(1, 20) == 1)

        rows.append(
            [
                nome,
                email,
                palavra_passe_hash,
                data_criacao.strftime("%Y-%m-%d %H:%M:%S"),
                str(admin_flag),
            ]
        )

    return rows


def write_utilizadores_csv(output_path: Path, rows: list[list[str]]) -> None:
    """Write UTF-8 CSV with header ``UTILIZADORES_FIELDNAMES``."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(UTILIZADORES_FIELDNAMES)
        writer.writerows(rows)


def load_utilizadores_to_db(_rows: list[list[str]], _config: SeedConfig) -> None:
    """
    Reserved for a future MySQL connection (e.g. ``INSERT`` or ``executemany``).

    Today: exit with a clear message; use CSV and ``LOAD DATA`` / your SQL tool until this
    is implemented.
    """
    raise SystemExit(
        "Direct MySQL insert is not implemented yet. "
        "Omit --db to write a CSV, then import with your client or LOAD DATA."
    )


def main() -> None:
    """
    Run the generator end-to-end.

    1. Remember ``scripts/`` as ``base_dir`` (where ``.env`` and default output live).
    2. Parse CLI; load ``scripts/.env`` if it exists.
    3. Build a seeded or unseeded ``Faker`` instance.
    4. Resolve row count and output path; read existing emails from that path if present.
    5. Build rows (new emails avoid prior + in-run collisions); write CSV; print confirmation.
    """
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    faker = create_faker("pt_PT", args.seed)
    config = resolve_config(args, base_dir)
    prior_emails = load_emails_from_existing_output(config.output_path)
    rows = build_utilizadores_rows(
        faker, config.num_users, existing_emails=prior_emails
    )
    if args.db:
        load_utilizadores_to_db(rows, config)

    if not args.write_csv and not args.db:
        raise SystemExit(
            "CSV output is disabled (--no-csv) and --db is not available yet. Nothing to do."
        )

    if args.write_csv:
        write_utilizadores_csv(config.output_path, rows)
        msg = f"Wrote {config.num_users} user(s) to {config.output_path}"
        if prior_emails:
            msg += (
                f" (reserved {len(prior_emails)} email(s) from previous file for uniqueness)"
            )
        print(msg)


if __name__ == "__main__":
    main()

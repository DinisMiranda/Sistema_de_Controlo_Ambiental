"""
Fake data for the ``Utilizadores`` table: writes a text file you can review (no database).

Run from ``scripts/``::

    python seed_utilizadores.py
    python seed_utilizadores.py -n 20

How this file is organised: a short overview here, then the rest of the documentation is
placed next to the code it describes (sections in ``main()`` and the email helpers below).
For a list of environment variables, see the block under "Resolve how many rows and where
to write" and ``scripts/.env.example``.
"""

from __future__ import annotations

import argparse
import os
import random
import re
import unicodedata
from pathlib import Path

from dotenv import load_dotenv
from faker import Faker

# ---------------------------------------------------------------------------
# Email helpers — turn a display name into firstname.lastname@example.pt
# ---------------------------------------------------------------------------
# We need ASCII slugs (no accents) for the local part, and every address in a run must
# be unique so the file could be imported without duplicate-key errors later.


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


def main() -> None:
    """Wire CLI → config → generated lines → write UTF-8 file; details in each step below."""

    # --- Parse command line ------------------------------------------------
    # Optional -n/--count overrides NUM_UTILIZADORES from the environment (see below).
    parser = argparse.ArgumentParser(description="Generate fake Utilizadores to a text file.")
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="number of users (overrides NUM_UTILIZADORES in scripts/.env)",
    )
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent

    # --- Load optional env file --------------------------------------------
    # Only ``scripts/.env`` is loaded so we do not accidentally read the API ``.env``.
    env_path = base_dir / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    faker = Faker("pt_PT")

    # --- Resolve how many rows and where to write ---------------------------
    # Precedence: ``-n`` / ``--count`` > ``NUM_UTILIZADORES`` > default 20.
    # Output path: ``UTILIZADORES_OUTPUT`` if set, else ``generated/utilizadores_examination.txt``
    # under this script’s directory. File is UTF-8 and replaced entirely each run.
    if args.count is not None:
        num_users = args.count
    else:
        num_users = int(os.getenv("NUM_UTILIZADORES", "20"))

    if num_users < 1:
        raise SystemExit("User count must be at least 1.")

    output_path = Path(
        os.getenv(
            "UTILIZADORES_OUTPUT",
            str(base_dir / "generated" / "utilizadores_examination.txt"),
        )
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # --- Build file contents ------------------------------------------------
    # Header lines start with ``#`` so they are easy to strip if you import the data.
    # Each data line: nome | email | hash | timestamp | admin (0/1).
    # Admin: each row gets independent 1/20 chance of 1 (Bernoulli), not “exactly one per 20”.
    used_emails: set[str] = set()
    lines: list[str] = []

    lines.append("# Utilizadores — generated for examination (not inserted into DB)")
    lines.append(
        "# Format: nome | email | palavra_passe_hash | data_criacao | admin "
        "(0/1; each row ~1/20 chance of admin, independent — not exactly 1 per 20 rows)"
    )
    lines.append("# Email pattern: firstname.lastname@example.pt")
    lines.append("")

    for _ in range(num_users):
        nome = faker.name()
        email = email_from_name(nome, used_emails)
        palavra_passe_hash = faker.sha256()
        data_criacao = faker.date_time_between(start_date="-1y", end_date="now")
        admin_flag = int(random.randint(1, 20) == 1)

        lines.append(
            f"{nome} | {email} | {palavra_passe_hash} | {data_criacao:%Y-%m-%d %H:%M:%S} | {admin_flag}"
        )

    # --- Write to disk and report ------------------------------------------
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {num_users} user(s) to {output_path}")


if __name__ == "__main__":
    main()

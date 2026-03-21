"""
Generate fake rows for the ``Utilizadores`` table and write them to a text file for review.

The script does **not** connect to MySQL; output is meant for manual inspection or
copy/paste workflows.

**Output file**

- Default path: ``scripts/generated/utilizadores_examination.txt`` (relative to this file).
- Override with environment variable ``UTILIZADORES_OUTPUT`` (absolute or relative path).
- Parent directories are created if missing.
- Encoding: UTF-8. Each run **overwrites** the target file.

**Line format (after comment header)**

Each data line is pipe-separated::

    nome | email | palavra_passe_hash | data_criacao | admin

- ``email``: ``firstname.lastname@example.pt`` (ASCII, accents stripped; collisions get a
  numeric suffix before ``@``).
- ``admin``: ``0`` or ``1``. Each user is assigned **independently** with probability
  **1/20** of being admin (Bernoulli trial). This is **not** “exactly one admin per 20
  users”; with few rows you may get zero or several admins.

**Configuration (precedence: CLI > environment > defaults)**

Environment variables are read from ``scripts/.env`` if that file exists (via
``python-dotenv``). They can also be set in the shell before running.

``NUM_UTILIZADORES`` (optional)
    Number of user rows to generate. Default: ``20`` if unset.

``UTILIZADORES_OUTPUT`` (optional)
    Path to the output text file. Default: ``generated/utilizadores_examination.txt``
    under the ``scripts/`` directory.

CLI:

``-n`` / ``--count N``
    Same meaning as ``NUM_UTILIZADORES``; **overrides** ``NUM_UTILIZADORES`` when given.

See also ``scripts/.env.example`` for a copy-paste template.
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


def slug_for_email(part: str) -> str:
    """Lowercase ASCII slug from a name token (strip accents, keep a-z0-9)."""
    normalized = unicodedata.normalize("NFD", part.strip())
    ascii_only = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "", ascii_only.lower())
    return slug or "user"


def email_from_name(full_name: str, used_emails: set[str]) -> str:
    """Build firstname.lastname@example.pt from display name; ensure uniqueness."""
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

    # Same slug pair can happen for different display names; append 2, 3, ...
    n = 2
    while True:
        candidate = f"{first}.{last}{n}@example.pt"
        if candidate not in used_emails:
            used_emails.add(candidate)
            return candidate
        n += 1


def main() -> None:
    """Parse CLI, load optional ``.env``, resolve config, generate rows, write output file."""
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
    env_path = base_dir / ".env"
    if env_path.exists():
        # Only load scripts/.env — avoids picking up unrelated project .env files
        load_dotenv(env_path)

    faker = Faker("pt_PT")

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
        # P(admin=1) = 1/20 per user; counts across rows are random (binomial), not fixed
        admin_flag = int(random.randint(1, 20) == 1)

        lines.append(
            f"{nome} | {email} | {palavra_passe_hash} | {data_criacao:%Y-%m-%d %H:%M:%S} | {admin_flag}"
        )

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {num_users} user(s) to {output_path}")


if __name__ == "__main__":
    main()

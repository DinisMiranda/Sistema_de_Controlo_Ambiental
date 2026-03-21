"""
Fake data for the ``Utilizadores`` table: writes a text file you can review (no database).

Run from ``scripts/``::

    python seed_utilizadores.py
    python seed_utilizadores.py -n 20

How this file is organised: a short overview here, then the rest of the documentation is
placed next to the code it describes. Flow: ``parse_args`` → ``load_env_from_script_dir`` →
``resolve_config`` → ``build_utilizadores_lines`` → ``write_lines_to_file``. Env vars are
documented in ``resolve_config`` and ``scripts/.env.example``.

**Admin field:** each generated user has an independent probability of 1/20 of being admin;
that is not the same as “exactly 1 in 20 users are admin.”
"""

from __future__ import annotations

import argparse
import os
import random
import re
import unicodedata
from dataclasses import dataclass
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


# ---------------------------------------------------------------------------
# CLI and configuration
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    """Define and parse ``-n`` / ``--count`` (overrides ``NUM_UTILIZADORES`` after env load)."""
    parser = argparse.ArgumentParser(description="Generate fake Utilizadores to a text file.")
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="number of users (overrides NUM_UTILIZADORES in scripts/.env)",
    )
    return parser.parse_args()


def load_env_from_script_dir(base_dir: Path) -> None:
    """Load ``scripts/.env`` if present so ``os.getenv`` sees ``NUM_UTILIZADORES`` / output path."""
    env_path = base_dir / ".env"
    if env_path.exists():
        # Only this file — avoids picking up backend ``.env`` by mistake.
        load_dotenv(env_path)


@dataclass(frozen=True)
class SeedConfig:
    """Resolved settings for one run (row count and where to write)."""

    num_users: int
    output_path: Path


def resolve_config(args: argparse.Namespace, base_dir: Path) -> SeedConfig:
    """
    Combine CLI and environment into a ``SeedConfig``.

    Precedence for row count: ``args.count`` > ``NUM_UTILIZADORES`` > default ``20``.
    Must be ``>= 1`` or the process exits.

    Output path: ``UTILIZADORES_OUTPUT`` if set, else
    ``generated/utilizadores_examination.txt`` under ``base_dir``. Parent directories are
    not created here — see ``write_lines_to_file``.
    """
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
    return SeedConfig(num_users=num_users, output_path=output_path)


# ---------------------------------------------------------------------------
# Generation and I/O
# ---------------------------------------------------------------------------


def build_utilizadores_lines(faker: Faker, num_users: int) -> list[str]:
    """
    Build the full file body: comment header, blank line, then ``num_users`` data lines.

    Each data line: ``nome | email | palavra_passe_hash | data_criacao | admin``.

    **Admin column:** each user has an **independent** probability of **1/20** of being
    admin (``1``). That does **not** mean exactly 1 in 20 users are admin—only that each
    draw is separate with that chance (so you can get 0, 1, or several admins in 20 rows).
    """
    used_emails: set[str] = set()
    lines: list[str] = []

    lines.append("# Utilizadores — generated for examination (not inserted into DB)")
    lines.append("# Format: nome | email | palavra_passe_hash | data_criacao | admin (0 or 1)")
    lines.append(
        "# Admin: each user has an independent probability of 1/20 of being admin — "
        "this is not the same as exactly 1 in 20 users being admin."
    )
    lines.append("# Email pattern: firstname.lastname@example.pt")
    lines.append("")

    for _ in range(num_users):
        nome = faker.name()
        email = email_from_name(nome, used_emails)
        palavra_passe_hash = faker.sha256()
        data_criacao = faker.date_time_between(start_date="-1y", end_date="now")
        # Independent P(admin)=1/20 for this row (not "1 admin per 20 users" globally).
        admin_flag = int(random.randint(1, 20) == 1)

        lines.append(
            f"{nome} | {email} | {palavra_passe_hash} | {data_criacao:%Y-%m-%d %H:%M:%S} | {admin_flag}"
        )

    return lines


def write_lines_to_file(output_path: Path, lines: list[str]) -> None:
    """Create parent folders if needed, write UTF-8 text, end with a newline."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    """Orchestrate: args → env → config → lines → disk."""
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    faker = Faker("pt_PT")
    config = resolve_config(args, base_dir)
    lines = build_utilizadores_lines(faker, config.num_users)
    write_lines_to_file(config.output_path, lines)
    print(f"Wrote {config.num_users} user(s) to {config.output_path}")


if __name__ == "__main__":
    main()

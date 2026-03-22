"""
Fake data for the ``Utilizadores`` table — **text file only** (no MySQL connection).

**What it does**
    Uses the Faker library (Portuguese locale) to invent names, datetimes, and placeholder
    “hash” strings, applies your email and admin rules, and writes a ``.txt`` you can open
    in an editor or parse later for ``INSERT`` statements. See https://faker.readthedocs.io/

**Quick run** (from ``scripts/``, with venv active or ``.venv/bin/python``)::

    python seed_utilizadores.py
    python seed_utilizadores.py -n 20
    python seed_utilizadores.py -n 10 --seed 42

``--seed`` fixes both ``random`` and Faker’s RNG so identical flags produce identical files
(reproducibility). Omit it for different output every run.

**End-to-end flow** (see ``main()``)::

    parse_args → load_env_from_script_dir → create_faker → resolve_config
        → load_emails_from_existing_output → build_utilizadores_lines → write_lines_to_file
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
``build_utilizadores_lines``  Comment header + data lines; seeds ``used_emails`` from prior file.
``write_lines_to_file``       ``mkdir`` parents, UTF-8 write, trailing newline.
============================= =============================================================

**Environment** (optional; copy ``.env.example`` → ``scripts/.env``):

* ``NUM_UTILIZADORES`` — default row count when ``-n`` is not passed (must be valid int).
* ``UTILIZADORES_OUTPUT`` — output path (default ``generated/utilizadores_examination.txt``).

**Admin column:** each row gets ``admin=1`` with independent probability **1/20**; that is
*not* the same as “exactly one admin in every batch of 20 users.”

For setup, table mapping, and troubleshooting, see ``README.md`` in this folder.
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
    """Define and parse CLI (count, optional seed for reproducible output)."""
    parser = argparse.ArgumentParser(description="Generate fake Utilizadores to a text file.")
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

    Output path: ``UTILIZADORES_OUTPUT`` if set, else
    ``generated/utilizadores_examination.txt`` under ``base_dir``. Parent directories are
    not created here — see ``write_lines_to_file``.
    """
    if args.count is not None:
        num_users = args.count
    else:
        num_users = parse_int_env("NUM_UTILIZADORES", 20)

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


def load_emails_from_existing_output(path: Path) -> set[str]:
    """
    Read the email column from an existing output file at ``path``, if any.

    Before each run overwrites the file, we parse prior data lines (pipe-separated, same
    format as we write) and collect emails so **new** rows never reuse them. Comment and
    blank lines are skipped; malformed lines are ignored.

    If ``path`` is missing or unreadable, returns an empty set.
    """
    if not path.is_file():
        return set()
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return set()

    emails: set[str] = set()
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        parts = stripped.split(" | ", 4)
        if len(parts) != 5:
            continue
        emails.add(parts[1].strip())
    return emails


def build_utilizadores_lines(
    faker: Faker,
    num_users: int,
    *,
    existing_emails: set[str] | None = None,
) -> list[str]:
    """
    Build the full file body: comment header, blank line, then ``num_users`` data lines.

    ``existing_emails`` is merged into the working set so addresses from a **previous**
    version of the same output file are not generated again (cross-run uniqueness for
    that path). Pass ``None`` or ``set()`` when starting from an empty or new file.

    Each data line: ``nome | email | palavra_passe_hash | data_criacao | admin``.

    **Admin column:** each user has an **independent** probability of **1/20** of being
    admin (``1``). That does **not** mean exactly 1 in 20 users are admin—only that each
    draw is separate with that chance (so you can get 0, 1, or several admins in 20 rows).
    """
    used_emails: set[str] = set(existing_emails) if existing_emails else set()
    lines: list[str] = []

    lines.append("# Utilizadores — generated for examination (not inserted into DB)")
    lines.append("# Format: nome | email | palavra_passe_hash | data_criacao | admin (0 or 1)")
    lines.append(
        "# Admin: each user has an independent probability of 1/20 of being admin — "
        "this is not the same as exactly 1 in 20 users being admin."
    )
    lines.append("# Email pattern: firstname.lastname@example.pt")
    lines.append(
        "# Email uniqueness: also avoids addresses already present in the previous "
        "contents of this output file (when the file existed before this run)."
    )
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
    """
    Run the generator end-to-end.

    1. Remember ``scripts/`` as ``base_dir`` (where ``.env`` and default output live).
    2. Parse CLI; load ``scripts/.env`` if it exists.
    3. Build a seeded or unseeded ``Faker`` instance.
    4. Resolve row count and output path; read existing emails from that path if present.
    5. Build lines (new emails avoid prior + in-run collisions); write file; print confirmation.
    """
    base_dir = Path(__file__).resolve().parent
    args = parse_args()
    load_env_from_script_dir(base_dir)
    faker = create_faker("pt_PT", args.seed)
    config = resolve_config(args, base_dir)
    prior_emails = load_emails_from_existing_output(config.output_path)
    lines = build_utilizadores_lines(
        faker, config.num_users, existing_emails=prior_emails
    )
    write_lines_to_file(config.output_path, lines)
    msg = f"Wrote {config.num_users} user(s) to {config.output_path}"
    if prior_emails:
        msg += f" (reserved {len(prior_emails)} email(s) from previous file for uniqueness)"
    print(msg)


if __name__ == "__main__":
    main()

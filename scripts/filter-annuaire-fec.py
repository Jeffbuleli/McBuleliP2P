#!/usr/bin/env python3
"""Filter FEC emails → priority import (entreprises) + pending free-mail."""

from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "content/hackathon-leads/annuaire-fec-emails.csv"
EXISTING = [
    ROOT / "content/hackathon-leads/annuaire-import-priority.csv",
    ROOT / "content/hackathon-leads/etape2-verified-leads.csv",
]
OUT_IMP = ROOT / "content/hackathon-leads/annuaire-fec-import-priority.csv"
OUT_PEND = ROOT / "content/hackathon-leads/annuaire-fec-pending-freemail.csv"
OUT_REG = ROOT / "content/hackathon-leads/annuaire-fec-filtered.csv"

FREE = {
    "gmail.com",
    "yahoo.fr",
    "yahoo.com",
    "hotmail.com",
    "hotmail.fr",
    "outlook.com",
    "icloud.com",
    "live.com",
    "msn.com",
    "aol.com",
    "protonmail.com",
    "mail.ru",
    "ymail.com",
}

GENERIC_LOCAL = {
    "info",
    "infos",
    "contact",
    "admin",
    "commercial",
    "support",
    "office",
    "hello",
    "sales",
    "ceo",
    "dg",
    "direction",
    "secretariat",
    "management",
    "rh",
    "hr",
    "it",
    "tech",
    "digital",
}

FOCUS_HINT = re.compile(
    r"informat|telecom|t[eé]l[eé]com|ntic|digital|software|logiciel|"
    r"fintech|banque|bank|assurance|data|cloud|cyber|web|mobile|"
    r"startup|tech|airtel|vodacom|orange|rawbank|ecobank|equity|"
    r"afriland|bgfi|citi|huawei|microsoft|ibm|oracle",
    re.I,
)

EXCLUDE_DOMAIN = re.compile(
    r"texaf-rdc\.com|silikinvillage|example\.com|sentry\.|wixpress|"
    r"fec-rdc\.com",  # org FEC elle-même — pas une cible lead-gen
    re.I,
)

EXCLUDE_EMAIL = re.compile(r"^noreply@|^no-reply@|^mailer-daemon@", re.I)


def domain(email: str) -> str:
    return email.split("@", 1)[-1].lower()


def local(email: str) -> str:
    return email.split("@", 1)[0].lower().split("+", 1)[0]


def load_existing() -> set[str]:
    seen: set[str] = set()
    for path in EXISTING:
        if not path.exists():
            continue
        with path.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                e = (row.get("email") or "").strip().lower()
                if e:
                    seen.add(e)
    return seen


def company_from(row: dict) -> str:
    hint = re.sub(r"\s+", " ", (row.get("company_hint") or "")).strip(" -|:;")
    hint = re.sub(r"^\+?\d[\d\s.-]{6,}$", "", hint).strip()
    hint = re.sub(r"^(Adresses?|Tel|Tél|Email|E-mail)\s*:?\s*", "", hint, flags=re.I)
    if len(hint) >= 3 and len(hint) <= 80 and "@" not in hint:
        return hint
    # fallback: domain brand
    d = domain(row["email"])
    brand = d.split(".")[0]
    if brand in FREE or len(brand) < 2:
        return ""
    return brand.upper()


def skills_for(email: str, hint: str) -> str:
    blob = f"{email} {hint}".lower()
    skills = ["entreprise", "business"]
    if FOCUS_HINT.search(blob):
        if re.search(r"banque|bank|finance|assurance|fintech", blob):
            skills += ["finance", "digital", "IT"]
        elif re.search(r"telecom|airtel|vodacom|orange|tigo", blob):
            skills += ["telecom", "digital", "software", "IT"]
        else:
            skills += ["informatique", "digital", "software", "IT"]
    else:
        skills += ["digital"]
    return ", ".join(dict.fromkeys(skills))


def main() -> None:
    existing = load_existing()
    rows = list(csv.DictReader(SRC.open(encoding="utf-8")))

    filtered: list[dict] = []
    for r in rows:
        email = (r.get("email") or "").strip().lower()
        if not email or "@" not in email:
            continue
        if email in existing:
            continue
        if EXCLUDE_EMAIL.search(email) or EXCLUDE_DOMAIN.search(email):
            continue
        d = domain(email)
        loc = local(email)
        base_local = loc.split(".")[0]
        hint = r.get("company_hint") or ""
        focus = r.get("focus_page") == "True"
        corp = d not in FREE
        generic = base_local in GENERIC_LOCAL or loc in GENERIC_LOCAL
        hint_hit = bool(FOCUS_HINT.search(f"{hint} {email}"))

        # Priority import: corporate emails (esp. generic mailbox) or focus+corporate
        if corp and (generic or focus or hint_hit):
            tier = "import"
        elif corp:
            tier = "import_corp"  # still useful B2B
        elif focus or hint_hit:
            tier = "pending_freemail"
        else:
            continue

        company = company_from(r) or (d.split(".")[0].upper() if corp else "Contact FEC")
        filtered.append(
            {
                **r,
                "email": email,
                "company": company,
                "tier": tier,
                "corporate": corp,
                "generic_mailbox": generic,
            }
        )

    # Dedup by email
    seen: set[str] = set()
    uniq: list[dict] = []
    for r in filtered:
        if r["email"] in seen:
            continue
        seen.add(r["email"])
        uniq.append(r)

    with OUT_REG.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "email",
                "company",
                "company_hint",
                "page",
                "focus_page",
                "tier",
                "corporate",
                "generic_mailbox",
                "source",
                "sourceUrl",
            ],
        )
        w.writeheader()
        for r in uniq:
            w.writerow(
                {
                    "email": r["email"],
                    "company": r["company"],
                    "company_hint": r.get("company_hint") or "",
                    "page": r.get("page") or "",
                    "focus_page": r.get("focus_page") or "",
                    "tier": r["tier"],
                    "corporate": r["corporate"],
                    "generic_mailbox": r["generic_mailbox"],
                    "source": "fec_2025",
                    "sourceUrl": "ANNUAIRE-FEC-Edition-2025 (1).pdf",
                }
            )

    import_rows = [r for r in uniq if r["tier"] in ("import", "import_corp")]
    pending = [r for r in uniq if r["tier"] == "pending_freemail"]

    with OUT_IMP.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "firstName",
                "lastName",
                "email",
                "phone",
                "company",
                "jobTitle",
                "location",
                "skills",
                "experience",
                "source",
                "notes",
                "linkedin",
            ],
        )
        w.writeheader()
        for r in import_rows:
            company = r["company"]
            last = company.split()[-1][:60] if company else ""
            w.writerow(
                {
                    "firstName": "Équipe",
                    "lastName": last,
                    "email": r["email"],
                    "phone": "",
                    "company": company[:160],
                    "jobTitle": "Contact entreprise · Annuaire FEC 2025",
                    "location": "Kinshasa",
                    "skills": skills_for(r["email"], r.get("company_hint") or ""),
                    "experience": "5",
                    "source": "fec",
                    "notes": (
                        f"sourceUrl: ANNUAIRE-FEC-Edition-2025 | page={r.get('page')} | "
                        f"focus={r.get('focus_page')} | hint={ (r.get('company_hint') or '')[:80] } | "
                        "localisation Kinshasa à vérifier si besoin"
                    )[:500],
                    "linkedin": "",
                }
            )

    with OUT_PEND.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["email", "company", "company_hint", "page", "notes", "sourceUrl"],
        )
        w.writeheader()
        for r in pending:
            w.writerow(
                {
                    "email": r["email"],
                    "company": r["company"],
                    "company_hint": r.get("company_hint") or "",
                    "page": r.get("page") or "",
                    "notes": "freemail FEC focus — enrichir société avant outreach pro",
                    "sourceUrl": "ANNUAIRE-FEC-Edition-2025 (1).pdf",
                }
            )

    print(
        f"filtered={len(uniq)} import={len(import_rows)} "
        f"pending_freemail={len(pending)}"
    )
    print(OUT_IMP)
    print(OUT_PEND)
    print(OUT_REG)


if __name__ == "__main__":
    main()

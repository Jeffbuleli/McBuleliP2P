#!/usr/bin/env python3
"""Parse SECTEURS list → registry + Kinshasa import CSV (email-centric, clean companies)."""

from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "content/hackathon-leads/sources/liste-entreprises-secteurs.txt"
OUT_REG = ROOT / "content/hackathon-leads/annuaire-contacts-registry.csv"
OUT_IMP = ROOT / "content/hackathon-leads/annuaire-import-priority.csv"
OUT_GO = ROOT / "content/hackathon-leads/annuaire-goafrica-pending.csv"

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
SITE_RE = re.compile(r"(www\.[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:/[^\s]*)?)", re.I)
LOC_RE = re.compile(
    r"\b(KINSHASA|KATANGA|NORD-KIVU|SUD-KIVU|BAS-CONGO|PROVINCE\s+ORIENTALE|Kinshasa|Katanga)\b",
    re.I,
)
EXCLUDE_EMAIL = re.compile(r"texaf-rdc\.com|silikinvillage", re.I)
EXCLUDE_COMPANY = re.compile(r"\bsilikin\b|\btexaf\b", re.I)

SECTORS = [
    "Agriculture, Industrie et Transports Fluvial",
    "Agriculture et Industrie",
    "Appareils électroménagers de toutes marques",
    "Commerce, Export, Construction, Hydrocarbure, Industrie et",
    "Commerce, Importation et Alimentation",
    "Commerce, Industrie et Télécommunication",
    "Commerce et Construction",
    "Commerce et Industrie",
    "Commerce,Construction",
    "Commerce et import produits pharmceutiques",
    "Commerce Général",
    "Construction métallique",
    "Distribution d’eau",
    "Distribution poids lourds, véhicules utilitaires, machine agricole",
    "Finances: Comptabilité",
    "Cabinet d'audit",
    "Industrie (Fabrication des bouteilles)",
    "Industrie minière",
    "Mines et Industrie",
    "Télécommunications satellitaires",
    "Informatique et Telecom",
    "Telecommunication",
    "Télécommunication",
    "Transport et Services",
    "Transport aérien",
    "Agro Industrie",
    "Hydrocarbures, Services",
    "Agriculture",
    "Association",
    "Automobile",
    "Bois",
    "Commerce",
    "Construction",
    "Electricité",
    "Energie",
    "Finances",
    "Forage",
    "Hydrocarbure",
    "Hydrocarbures",
    "Industrie",
    "Mines",
    "NTIC",
    "Services",
    "Transports",
    "Transport",
]

IT_SECTOR = re.compile(
    r"ntic|t[eé]l[eé]com|informatique|digital|huawei|tech mahindra|"
    r"radiocom|hologram|afrinet|micronet|\bstc\b|cielux|gbs|iburst|"
    r"vodacom|airtel|orange|tigo|intercom",
    re.I,
)
PRIORITY_SECTOR = re.compile(
    r"ntic|t[eé]l[eé]com|informatique|digital|finances?|banque|"
    r"assurance|services|radiocom|huawei|tech|hologram|cloud|broadband",
    re.I,
)


def skills_for(sector: str, company: str) -> str:
    blob = f"{sector} {company}".lower()
    skills = ["entreprise", "business"]
    if IT_SECTOR.search(blob) or "ntic" in blob:
        skills += ["informatique", "digital", "software", "IT", "telecom"]
    elif re.search(r"finance|banque|assurance|cash|money|audit|kpmg|pwc", blob, re.I):
        skills += ["finance", "digital", "IT", "business"]
    elif re.search(r"telecom|huawei|airtel|vodacom|orange|tigo", blob, re.I):
        skills += ["telecom", "digital", "software", "IT"]
    elif re.search(r"services", blob, re.I):
        skills += ["services", "business", "digital"]
    return ", ".join(dict.fromkeys(skills))


def split_sector_company(before: str) -> tuple[str, str]:
    text = re.sub(r"\s+", " ", before).strip(" -|,")
    for prefix in sorted(SECTORS, key=len, reverse=True):
        if text.upper().startswith(prefix.upper()):
            return prefix, text[len(prefix) :].strip(" -|,")
    # fallback: first word = sector
    parts = text.split(" ", 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return "", text


def parse_records(text: str) -> list[dict]:
    # Flatten newlines that break rows (keep spaces)
    flat = re.sub(r"\n+", " ", text)
    flat = re.sub(r"\s+", " ", flat)
    rows: list[dict] = []
    seen: set[str] = set()
    for m in EMAIL_RE.finditer(flat):
        email = m.group(0).lower().rstrip(".,;")
        if email in seen or EXCLUDE_EMAIL.search(email):
            continue
        start = max(0, m.start() - 180)
        end = min(len(flat), m.end() + 120)
        window = flat[start:end]
        # location near email
        loc = ""
        for lm in LOC_RE.finditer(window):
            # prefer location after email
            if lm.start() >= (m.start() - start) - 5:
                loc = lm.group(1)
                break
        if not loc:
            lm2 = list(LOC_RE.finditer(window))
            if lm2:
                loc = lm2[-1].group(1)
        location = loc.title().replace("Kinshasa", "Kinshasa")
        if location.upper() == "KINSHASA":
            location = "Kinshasa"

        site = ""
        sm = SITE_RE.search(flat[m.end() : m.end() + 80])
        if sm:
            site = sm.group(1)

        before = flat[start : m.start()]
        # trim previous email tail
        prev = list(EMAIL_RE.finditer(before))
        if prev:
            before = before[prev[-1].end() :]
        # drop trailing site from previous
        before = SITE_RE.sub(" ", before)
        before = LOC_RE.sub(" ", before)
        sector, company = split_sector_company(before)
        company = re.sub(r"\s+", " ", company).strip(" -|,")
        company = re.sub(r"^(et|de|du|des|la|le|les)\s+", "", company, flags=re.I)
        if len(company) < 2:
            company = email.split("@")[0]
        # cut overly long merges
        if len(company) > 80:
            company = company[:80].rsplit(" ", 1)[0]
        if EXCLUDE_COMPANY.search(company):
            continue
        if re.search(r"LISTE|SECTEUR D|QUELQUES ENTREPRISES|ACTIVITES NOM", company, re.I):
            continue
        if re.search(r"^LISTE$|^SECTEUR$", sector, re.I):
            continue
        seen.add(email)
        rows.append(
            {
                "sector": sector,
                "company": company,
                "email": email,
                "website": site,
                "location": location,
                "source": "secteurs_pdf",
                "sourceUrl": "liste entreprises possedant site web SECTEURS(2).pdf",
            }
        )
    return rows


def main() -> None:
    text = SRC.read_text(encoding="utf-8", errors="replace")
    rows = parse_records(text)

    with OUT_REG.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "sector",
                "company",
                "email",
                "website",
                "location",
                "source",
                "sourceUrl",
                "priority",
                "it_related",
            ],
        )
        w.writeheader()
        for r in rows:
            blob = f"{r['sector']} {r['company']}"
            it_related = bool(IT_SECTOR.search(blob))
            kin = bool(re.search(r"kinshasa", r["location"] or "", re.I))
            priority = (
                "high"
                if kin and PRIORITY_SECTOR.search(blob)
                else ("medium" if kin else "low")
            )
            w.writerow({**r, "priority": priority, "it_related": it_related})

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
        n = 0
        for r in rows:
            if not re.search(r"kinshasa", r["location"] or "", re.I):
                continue
            company = r["company"]
            sector = r["sector"] or "Entreprise"
            last = company.split()[-1] if company else ""
            w.writerow(
                {
                    "firstName": "Équipe",
                    "lastName": last[:60],
                    "email": r["email"],
                    "phone": "",
                    "company": company[:160],
                    "jobTitle": f"Contact entreprise · {sector}"[:160],
                    "location": "Kinshasa",
                    "skills": skills_for(sector, company),
                    "experience": "5",
                    "source": "annuaire",
                    "notes": (
                        f"sourceUrl: {r['sourceUrl']} | secteur: {sector} | "
                        f"site: {r['website']} | desk technique / digital — formation outils intelligence artificielle"
                    )[:500],
                    "linkedin": "",
                }
            )
            n += 1

    goafrica = [
        {
            "company": "SISTEC",
            "location": "Kinshasa",
            "phone": "+243981660382",
            "email": "",
            "notes": "GoAfrica technologie appliquée — sécurité électronique",
            "sourceUrl": "https://www.goafricaonline.com/cd/annuaire/societes-de-technologie-appliquee",
        },
        {
            "company": "SKATEK CORPORATION",
            "location": "Kinshasa",
            "phone": "+243827855067",
            "email": "",
            "notes": "GoAfrica — TIC / solutions informatiques",
            "sourceUrl": "https://www.goafricaonline.com/cd/annuaire/societes-de-technologie-appliquee",
        },
        {
            "company": "CHK (Computer House of Kinshasa)",
            "location": "Kinshasa",
            "phone": "+243901815632",
            "email": "",
            "notes": "GoAfrica informatique — web/hébergement; vérifier si déjà partenaire",
            "sourceUrl": "https://www.goafricaonline.com/cd/annuaire/informatique",
        },
        {
            "company": "LOKETE",
            "location": "Kinshasa",
            "phone": "",
            "email": "",
            "notes": "GoAfrica — IT services + training Gombe",
            "sourceUrl": "https://www.goafricaonline.com/cd/annuaire/informatique",
        },
        {
            "company": "OGARA NUMERIQUE",
            "location": "Kinshasa",
            "phone": "+243903668702",
            "email": "",
            "notes": "GoAfrica — NTIC Limete",
            "sourceUrl": "https://www.goafricaonline.com/cd/annuaire/informatique",
        },
        {
            "company": "SB TELECOM WIFI",
            "location": "Kinshasa",
            "phone": "+243812353941",
            "email": "",
            "notes": "GoAfrica — télécom Gombe",
            "sourceUrl": "https://www.goafricaonline.com/cd/annuaire/informatique",
        },
        {
            "company": "Amtech technology",
            "location": "Goma",
            "phone": "+243977776716",
            "email": "",
            "notes": "GoAfrica — AI SDKs (hors Kinshasa)",
            "sourceUrl": "https://www.goafricaonline.com/cd/annuaire/societes-de-technologie-appliquee",
        },
    ]
    with OUT_GO.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["company", "location", "phone", "email", "notes", "sourceUrl"],
        )
        w.writeheader()
        w.writerows(goafrica)

    print(f"registry={len(rows)} import_kinshasa={n}")
    print(OUT_REG)
    print(OUT_IMP)


if __name__ == "__main__":
    main()

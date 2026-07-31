#!/usr/bin/env python3
"""Extract FEC PDF emails into a secondary registry (TIC/telecom/digital focus + all with email)."""

from __future__ import annotations

import csv
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "content/hackathon-leads/sources/ANNUAIRE-FEC-Edition-2025.pdf"
OUT = ROOT / "content/hackathon-leads/annuaire-fec-emails.csv"

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
FOCUS = re.compile(
    r"informat|telecom|t[eé]l[eé]com|ntic|digital|software|logiciel|"
    r"fintech|banque|bank|assurance|data|cloud|cyber|web|mobile|startup",
    re.I,
)
EXCLUDE = re.compile(r"texaf-rdc\.com|silikinvillage|example\.com|sentry\.|wixpress", re.I)


def main() -> None:
    if not PDF.exists():
        print("missing_pdf")
        return
    reader = PdfReader(str(PDF))
    rows: list[dict] = []
    seen: set[str] = set()
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        emails = EMAIL_RE.findall(text)
        focus = bool(FOCUS.search(text))
        for e in emails:
            email = e.lower().rstrip(".,;")
            if email in seen or EXCLUDE.search(email):
                continue
            seen.add(email)
            # grab nearby company-ish line
            company = ""
            for line in text.splitlines():
                if e in line or email in line.lower():
                    company = re.sub(EMAIL_RE, "", line).strip(" -|:;")[:160]
                    break
            rows.append(
                {
                    "email": email,
                    "company_hint": company,
                    "page": i + 1,
                    "focus_page": focus,
                    "source": "fec_2025",
                    "sourceUrl": "ANNUAIRE-FEC-Edition-2025 (1).pdf",
                }
            )
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "email",
                "company_hint",
                "page",
                "focus_page",
                "source",
                "sourceUrl",
            ],
        )
        w.writeheader()
        w.writerows(rows)
    focus_n = sum(1 for r in rows if r["focus_page"])
    print(f"fec_emails={len(rows)} focus_pages_emails={focus_n} wrote={OUT}")


if __name__ == "__main__":
    main()

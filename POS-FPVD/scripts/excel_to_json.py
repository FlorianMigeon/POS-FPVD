#!/usr/bin/env python3
"""Convertit le fichier Excel "Point POS" en base de données JSON pour le catalogue.

Usage :
    python3 scripts/excel_to_json.py chemin/vers/Point_POS.xlsx

Le résultat est écrit dans data/catalogue.json.
Nécessite : pip install openpyxl
"""
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

import openpyxl

COLUMNS = [
    "brand",        # Marque
    "name",         # POS
    "subElement",   # Sous-élément
    "comments",     # Commentaires
    "uvc",          # UVC
    "hasVisual",    # Visuel
    "costPrice",    # PR
    "price",        # PV
    "supplier",     # Dernier Fournisseur
    "ownership",    # Appartenance
    "warehouse",    # Dépôt
    "code",         # Code Article
    "service",      # Service
]


def slugify(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text


def clean(value):
    if value is None:
        return None
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    text = str(value).strip()
    return text or None


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source = Path(sys.argv[1])
    out_path = Path(__file__).resolve().parent.parent / "data" / "catalogue.json"

    wb = openpyxl.load_workbook(source, data_only=True)
    ws = wb.active

    items = []
    counters = {}
    last_brand = None
    for row in ws.iter_rows(min_row=2, values_only=True):
        values = [clean(v) for v in row[: len(COLUMNS)]]
        if not any(values):
            continue
        record = dict(zip(COLUMNS, values))
        # Certaines lignes héritent de la marque de la ligne précédente
        if not record["brand"]:
            record["brand"] = last_brand
        last_brand = record["brand"]
        record["hasVisual"] = record["hasVisual"] in ("1", "True", "Photo")

        brand_slug = slugify(record["brand"])
        counters[brand_slug] = counters.get(brand_slug, 0) + 1
        record["id"] = f"{brand_slug}-{counters[brand_slug]:02d}"
        # Nom de fichier photo attendu : <code article>.jpg|png|webp
        record["image"] = record["code"]
        items.append(record)

    brands = sorted({i["brand"] for i in items}, key=slugify)
    catalogue = {
        "updatedAt": date.today().isoformat(),
        "brands": [{"id": slugify(b), "name": b} for b in brands],
        "items": items,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{len(items)} articles, {len(brands)} marques -> {out_path}")


if __name__ == "__main__":
    main()

"""ETL: Transform scraped JSON into a normalized SQLite database with English translations."""

import json
import re
import sqlite3
from pathlib import Path

DATA_DIR = Path("data")
DB_PATH = DATA_DIR / "customs.db"

# ---------------------------------------------------------------------------
# Arabic → English translation maps
# ---------------------------------------------------------------------------

TAX_LABELS = {
    "ضريبة الوارد": "Import Duty",
    "ضريبة قيمه مضافه": "VAT",
    "ضريبة الجدول": "Table Tax",
    "تامين صحى وزارة الصحة": "Health Insurance Levy",
    "رسم محصلة لحساب غرفة دخان": "Tobacco Chamber Fee",
    "رسم محصلة لحساب غرفة نسيج": "Textile Chamber Fee",
    "رسم محصلة لحساب غرفةجلود": "Leather Chamber Fee",
}

FTA_LABELS = {
    "اتفاقيه الشراكه المصريه الاوربيه": "EU-Egypt Partnership Agreement",
    "اتفاقيه بريطانيا": "UK-Egypt Agreement",
    "اتفاقيه تركيا": "Turkey-Egypt Agreement",
    "اتفاقية أمريكا اللاتينية الميركسور": "MERCOSUR Agreement",
    "الافتا": "EFTA Agreement",
    "حره افريقيه ب": "AfCFTA Group B",
    "نظام الجات": "WTO/GATT",
    "GSTP": "GSTP",
}

RATE_TRANSLATIONS = {
    "صفر": "0%",
}


def translate_rate(raw: str) -> str:
    """Extract and translate the rate portion of a tax string."""
    raw = raw.strip()
    for ar, en in RATE_TRANSLATIONS.items():
        raw = raw.replace(ar, en)
    return raw


def _split_rate_note(rate: str) -> tuple[str, str | None]:
    """Split '14% (من القيمة + ر.ض.جمركية)' into ('14%', 'من القيمة + ر.ض.جمركية')."""
    m = re.match(r"^(.*?)\s*\((.+)\)\s*$", rate)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return rate, None


def parse_tax_entry(entry: str) -> dict | None:
    """Parse a single tax string like 'ضريبة الوارد :  5%' into structured data."""
    entry = entry.strip()
    if not entry:
        return None

    if ":" not in entry:
        en = FTA_LABELS.get(entry, entry)
        return {"type": "agreement", "label_ar": entry, "label_en": en, "rate": None, "rate_note": None}

    parts = entry.split(":", 1)
    label_ar = parts[0].strip()
    rate_raw = parts[1].strip() if len(parts) > 1 else ""

    label_en = TAX_LABELS.get(label_ar, label_ar)
    rate = translate_rate(rate_raw)
    rate, rate_note = _split_rate_note(rate)

    return {"type": "tax", "label_ar": label_ar, "label_en": label_en, "rate": rate, "rate_note": rate_note}


def extract_chapter(code: str) -> str:
    """Extract chapter number from HS code like '01/02/03/04/05' → '01'."""
    return code.split("/")[0] if "/" in code else code[:2]


def extract_numeric_rate(rate_str: str | None) -> float | None:
    """Extract numeric rate from rate string. '5%' -> 5.0, '0%' -> 0.0, None -> None."""
    if not rate_str:
        return None
    m = re.search(r"([\d.]+)", rate_str)
    return float(m.group(1)) if m else None


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

SCHEMA = """
CREATE TABLE IF NOT EXISTS tariffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    chapter TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    short_description_ar TEXT NOT NULL,
    import_duty_numeric REAL,
    vat_numeric REAL
);

CREATE TABLE IF NOT EXISTS taxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tariff_code TEXT NOT NULL REFERENCES tariffs(code),
    type TEXT NOT NULL,  -- 'tax' or 'agreement'
    label_ar TEXT NOT NULL,
    label_en TEXT NOT NULL,
    rate TEXT,
    rate_note TEXT,
    rate_numeric REAL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS instructions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tariff_code TEXT NOT NULL REFERENCES tariffs(code),
    code TEXT,
    text_ar TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tariffs_chapter ON tariffs(chapter);
CREATE INDEX IF NOT EXISTS idx_taxes_tariff ON taxes(tariff_code);
CREATE INDEX IF NOT EXISTS idx_taxes_type_code ON taxes(type, tariff_code);
CREATE INDEX IF NOT EXISTS idx_taxes_duty ON taxes(label_en, type, rate_numeric);
CREATE INDEX IF NOT EXISTS idx_instructions_tariff ON instructions(tariff_code);

-- FTS for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS tariffs_fts USING fts5(
    code,
    description_ar,
    short_description_ar,
    content='tariffs',
    content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS tariffs_ai AFTER INSERT ON tariffs BEGIN
    INSERT INTO tariffs_fts(rowid, code, description_ar, short_description_ar)
    VALUES (new.id, new.code, new.description_ar, new.short_description_ar);
END;
"""


def build_db() -> None:
    DB_PATH.unlink(missing_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.executescript(SCHEMA)

    raw = json.loads((DATA_DIR / "tariffs.json").read_text())
    print(f"Loading {len(raw)} tariff records …")

    conn.execute("BEGIN")
    for record in raw:
        code = record["Number"]
        chapter = extract_chapter(code)

        conn.execute(
            "INSERT OR IGNORE INTO tariffs (code, chapter, description_ar, short_description_ar) VALUES (?, ?, ?, ?)",
            (code, chapter, record.get("Desc", ""), record.get("ShortDesc", "")),
        )

        # Taxes + agreements
        taxes_raw = record.get("Taxes", [])
        current_agreement = None
        sort_order = 0
        import_duty_numeric = None
        vat_numeric = None

        for t in taxes_raw:
            parsed = parse_tax_entry(t)
            if parsed is None:
                continue

            rate_numeric = extract_numeric_rate(parsed["rate"])

            if parsed["type"] == "agreement":
                current_agreement = parsed["label_en"]
                conn.execute(
                    "INSERT INTO taxes (tariff_code, type, label_ar, label_en, rate, rate_note, rate_numeric, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (code, "agreement", parsed["label_ar"], parsed["label_en"], None, None, None, sort_order),
                )
            else:
                label_en = parsed["label_en"]
                if current_agreement:
                    label_en = f"{parsed['label_en']} ({current_agreement})"
                conn.execute(
                    "INSERT INTO taxes (tariff_code, type, label_ar, label_en, rate, rate_note, rate_numeric, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (code, "tax", parsed["label_ar"], label_en, parsed["rate"], parsed["rate_note"], rate_numeric, sort_order),
                )
                # Track primary rates for tariff-level columns
                if parsed["label_en"] == "Import Duty" and not current_agreement:
                    import_duty_numeric = rate_numeric
                elif parsed["label_en"] == "VAT" and not current_agreement:
                    vat_numeric = rate_numeric

            sort_order += 1

        # Update tariff with pre-computed rates
        if import_duty_numeric is not None or vat_numeric is not None:
            conn.execute(
                "UPDATE tariffs SET import_duty_numeric = ?, vat_numeric = ? WHERE code = ?",
                (import_duty_numeric, vat_numeric, code),
            )

        # Instructions
        instructions = record.get("Instructions", [])
        inst_codes = record.get("InstructionCodes", [])
        for idx, text in enumerate(instructions):
            inst_code = inst_codes[idx] if idx < len(inst_codes) else None
            conn.execute(
                "INSERT INTO instructions (tariff_code, code, text_ar, sort_order) VALUES (?, ?, ?, ?)",
                (code, inst_code, text, idx),
            )

    conn.commit()

    # Stats
    count = conn.execute("SELECT COUNT(*) FROM tariffs").fetchone()[0]
    tax_count = conn.execute("SELECT COUNT(*) FROM taxes").fetchone()[0]
    inst_count = conn.execute("SELECT COUNT(*) FROM instructions").fetchone()[0]
    chapters = conn.execute("SELECT COUNT(DISTINCT chapter) FROM tariffs").fetchone()[0]

    print(f"Done. DB: {DB_PATH}")
    print(f"  {count} tariff codes across {chapters} chapters")
    print(f"  {tax_count} tax/fee entries")
    print(f"  {inst_count} regulatory instructions")

    conn.close()


if __name__ == "__main__":
    build_db()

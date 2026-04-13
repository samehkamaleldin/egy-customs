"""FastAPI backend for Egyptian Customs Tariff search."""

import re
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

DB_PATH = Path("data/customs.db")

app = FastAPI(title="Egyptian Customs Tariff API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SORT_COLUMNS = {
    "code": "t.code",
    "chapter": "t.chapter",
    "duty": "import_duty_sort",
}


@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def _extract_duty_rate(rate_str: str | None) -> float:
    """Extract numeric rate for sorting. '5%' -> 5.0, '0%' -> 0, None -> -1."""
    if not rate_str:
        return -1.0
    m = re.search(r"([\d.]+)", rate_str)
    return float(m.group(1)) if m else -1.0


@app.get("/api/search")
def search(
    q: str = Query("", description="Search query (HS code or keyword)"),
    chapter: str = Query("", description="Filter by chapter"),
    duty_min: str = Query("", description="Min duty rate filter"),
    duty_max: str = Query("", description="Max duty rate filter"),
    has_fta: str = Query("", description="Filter items with trade agreements"),
    sort: str = Query("code", description="Sort by: code, chapter, duty"),
    order: str = Query("asc", description="Sort order: asc, desc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
):
    offset = (page - 1) * per_page

    with get_db() as conn:
        conditions = []
        params: list = []

        if q.strip():
            normalized = q.strip().replace("/", "").replace(" ", "")
            if normalized.isdigit():
                conditions.append("t.code LIKE ?")
                params.append(q.strip() + "%")
            else:
                conditions.append(
                    "t.id IN (SELECT rowid FROM tariffs_fts WHERE tariffs_fts MATCH ?)"
                )
                params.append(q.strip())

        if chapter:
            conditions.append("t.chapter = ?")
            params.append(chapter.zfill(2))

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        # Count
        total = conn.execute(f"SELECT COUNT(*) FROM tariffs t {where}", params).fetchone()[0]

        # Fetch page
        sort_col = SORT_COLUMNS.get(sort, "t.code")
        sort_dir = "DESC" if order == "desc" else "ASC"

        sql = f"""
            SELECT t.code, t.chapter, t.description_ar, t.short_description_ar
            FROM tariffs t
            {where}
            ORDER BY {sort_col} {sort_dir}
            LIMIT ? OFFSET ?
        """
        rows = conn.execute(sql, [*params, per_page, offset]).fetchall()

        results = []
        for row in rows:
            taxes = conn.execute(
                "SELECT type, label_en, label_ar, rate FROM taxes WHERE tariff_code = ? ORDER BY sort_order",
                (row["code"],),
            ).fetchall()

            tax_list = [
                {"type": t["type"], "label_en": t["label_en"], "label_ar": t["label_ar"], "rate": t["rate"]}
                for t in taxes
            ]

            # Extract primary rates for easy frontend consumption
            import_duty = next(
                (t["rate"] for t in tax_list if t["label_en"] == "Import Duty" and t["rate"]),
                None,
            )
            vat = next(
                (t["rate"] for t in tax_list if t["label_en"] == "VAT" and t["rate"]),
                None,
            )
            agreements = [t["label_en"] for t in tax_list if t["type"] == "agreement"]

            item = {
                "code": row["code"],
                "chapter": row["chapter"],
                "description_ar": row["description_ar"],
                "short_description_ar": row["short_description_ar"],
                "import_duty": import_duty,
                "vat": vat,
                "agreements": agreements,
                "taxes": tax_list,
            }

            # Post-filter by duty range
            if duty_min or duty_max:
                rate = _extract_duty_rate(import_duty)
                if duty_min and rate < float(duty_min):
                    total -= 1
                    continue
                if duty_max and rate > float(duty_max):
                    total -= 1
                    continue

            # Post-filter by FTA
            if has_fta == "true" and not agreements:
                total -= 1
                continue

            results.append(item)

        return {
            "results": results,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": max(1, (total + per_page - 1) // per_page),
        }


@app.get("/api/tariff/{code:path}")
def get_tariff(code: str):
    with get_db() as conn:
        row = conn.execute(
            "SELECT code, chapter, description_ar, short_description_ar FROM tariffs WHERE code = ?",
            (code,),
        ).fetchone()

        if not row:
            return {"error": "Not found"}

        taxes = conn.execute(
            "SELECT type, label_en, label_ar, rate FROM taxes WHERE tariff_code = ? ORDER BY sort_order",
            (code,),
        ).fetchall()

        instructions = conn.execute(
            "SELECT code, text_ar FROM instructions WHERE tariff_code = ? ORDER BY sort_order",
            (code,),
        ).fetchall()

        tax_list = [
            {"type": t["type"], "label_en": t["label_en"], "label_ar": t["label_ar"], "rate": t["rate"]}
            for t in taxes
        ]

        return {
            "code": row["code"],
            "chapter": row["chapter"],
            "description_ar": row["description_ar"],
            "short_description_ar": row["short_description_ar"],
            "import_duty": next((t["rate"] for t in tax_list if t["label_en"] == "Import Duty" and t["rate"]), None),
            "vat": next((t["rate"] for t in tax_list if t["label_en"] == "VAT" and t["rate"]), None),
            "agreements": [t["label_en"] for t in tax_list if t["type"] == "agreement"],
            "taxes": tax_list,
            "instructions": [
                {"code": i["code"], "text_ar": i["text_ar"]}
                for i in instructions
            ],
        }


@app.get("/api/chapters")
def list_chapters():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT chapter, COUNT(*) as count FROM tariffs GROUP BY chapter ORDER BY chapter"
        ).fetchall()
        return [{"chapter": r["chapter"], "count": r["count"]} for r in rows]


@app.get("/api/tree")
def tree(parent: str = Query("", description="Parent code prefix for tree drill-down")):
    """Hierarchical tree view. Pass empty for chapters, '01' for chapter 01 headings, etc."""
    with get_db() as conn:
        if not parent:
            # Top level: chapters
            rows = conn.execute(
                "SELECT chapter, COUNT(*) as count FROM tariffs GROUP BY chapter ORDER BY chapter"
            ).fetchall()
            return [
                {"id": r["chapter"], "label": f"Chapter {r['chapter']}", "count": r["count"], "leaf": False}
                for r in rows
            ]

        # Determine depth from parent to figure out next grouping level
        # HS codes: XX/XX/XX/XX/XX — 5 pairs
        depth = len(parent.split("/")) if "/" in parent else 1
        prefix = parent + "/" if "/" in parent else parent + "/"

        if depth >= 4:
            # Leaf level: return actual tariff items
            rows = conn.execute(
                "SELECT code, short_description_ar FROM tariffs WHERE code LIKE ? ORDER BY code",
                (parent + "%",),
            ).fetchall()
            return [
                {"id": r["code"], "label": r["short_description_ar"], "count": 0, "leaf": True}
                for r in rows
            ]

        # Group by next level
        # e.g. for parent='01', group by first 5 chars: '01/01', '01/02', etc.
        next_len = len(prefix) + 2  # next pair
        rows = conn.execute(
            """
            SELECT SUBSTR(code, 1, ?) as grp, COUNT(*) as count, MIN(short_description_ar) as sample_desc
            FROM tariffs
            WHERE code LIKE ?
            GROUP BY grp
            ORDER BY grp
            """,
            (next_len, parent + "%"),
        ).fetchall()

        return [
            {"id": r["grp"], "label": r["sample_desc"], "count": r["count"], "leaf": r["count"] == 1}
            for r in rows
        ]


@app.get("/api/stats")
def stats():
    with get_db() as conn:
        tariffs = conn.execute("SELECT COUNT(*) FROM tariffs").fetchone()[0]
        chapters = conn.execute("SELECT COUNT(DISTINCT chapter) FROM tariffs").fetchone()[0]
        taxes = conn.execute("SELECT COUNT(*) FROM taxes").fetchone()[0]
        instructions = conn.execute("SELECT COUNT(*) FROM instructions").fetchone()[0]

        # Duty distribution
        duty_dist = conn.execute("""
            SELECT
                CASE
                    WHEN tx.rate LIKE '0%%' OR tx.rate = '0%%' THEN 'Free'
                    WHEN CAST(REPLACE(REPLACE(tx.rate, '%%', ''), ' ', '') AS REAL) BETWEEN 0.1 AND 5 THEN '1-5%'
                    WHEN CAST(REPLACE(REPLACE(tx.rate, '%%', ''), ' ', '') AS REAL) BETWEEN 5.1 AND 10 THEN '5-10%'
                    WHEN CAST(REPLACE(REPLACE(tx.rate, '%%', ''), ' ', '') AS REAL) BETWEEN 10.1 AND 20 THEN '10-20%'
                    WHEN CAST(REPLACE(REPLACE(tx.rate, '%%', ''), ' ', '') AS REAL) BETWEEN 20.1 AND 40 THEN '20-40%'
                    WHEN CAST(REPLACE(REPLACE(tx.rate, '%%', ''), ' ', '') AS REAL) > 40 THEN '40%+'
                    ELSE 'Other'
                END as bracket,
                COUNT(*) as count
            FROM taxes tx
            WHERE tx.label_en = 'Import Duty' AND tx.type = 'tax'
            GROUP BY bracket
        """).fetchall()

        return {
            "tariffs": tariffs,
            "chapters": chapters,
            "tax_entries": taxes,
            "instructions": instructions,
            "duty_distribution": {r["bracket"]: r["count"] for r in duty_dist},
        }

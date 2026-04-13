"""FastAPI backend for Egyptian Customs Tariff search."""

import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

DB_PATH = Path("data/customs.db")

app = FastAPI(title="Egyptian Customs Tariff API", version="1.0.0")

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

CACHE_STATIC = "public, max-age=3600, stale-while-revalidate=86400"
CACHE_NONE = "no-store"


def _init_connection() -> sqlite3.Connection:
    """Create a persistent read-only connection with optimized pragmas."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA cache_size=-8000")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute("PRAGMA query_only=ON")
    return conn


_db: sqlite3.Connection | None = None
_stats_cache: dict | None = None


def get_db() -> sqlite3.Connection:
    """Return the persistent connection, creating it on first use."""
    global _db
    if _db is None:
        _db = _init_connection()
    return _db


def _sanitize_fts_query(q: str) -> str:
    """Escape FTS5 special characters to prevent query syntax errors."""
    cleaned = re.sub(r'["\(\)\*\^]', " ", q)
    tokens = cleaned.split()
    if not tokens:
        return '""'
    return " ".join(f'"{token}"' for token in tokens)


def _build_search_item(row: sqlite3.Row, taxes: list[sqlite3.Row]) -> dict:
    """Build a slim search result — no taxes array, just summary fields."""
    import_duty = None
    vat = None
    agreement_count = 0
    for t in taxes:
        if t["type"] == "agreement":
            agreement_count += 1
        elif t["label_en"] == "Import Duty" and t["rate"]:
            import_duty = t["rate"]
        elif t["label_en"] == "VAT" and t["rate"]:
            vat = t["rate"]

    return {
        "code": row["code"],
        "chapter": row["chapter"],
        "description_ar": row["description_ar"],
        "short_description_ar": row["short_description_ar"],
        "import_duty": import_duty,
        "vat": vat,
        "agreement_count": agreement_count,
    }


def _build_tariff_detail(row: sqlite3.Row, taxes: list[sqlite3.Row]) -> dict:
    """Build a full tariff response with taxes array — for detail endpoint."""
    tax_list = [
        {"type": t["type"], "label_en": t["label_en"], "label_ar": t["label_ar"], "rate": t["rate"], "rate_note": t["rate_note"]}
        for t in taxes
    ]
    import_duty = next(
        (t["rate"] for t in tax_list if t["label_en"] == "Import Duty" and t["rate"]),
        None,
    )
    vat = next(
        (t["rate"] for t in tax_list if t["label_en"] == "VAT" and t["rate"]),
        None,
    )
    agreements = [t["label_en"] for t in tax_list if t["type"] == "agreement"]

    return {
        "code": row["code"],
        "chapter": row["chapter"],
        "description_ar": row["description_ar"],
        "short_description_ar": row["short_description_ar"],
        "import_duty": import_duty,
        "vat": vat,
        "agreements": agreements,
        "taxes": tax_list,
    }


@app.get("/api/search")
def search(
    response: Response,
    q: str = Query("", description="Search query (HS code or keyword)"),
    chapter: str = Query("", description="Filter by chapter"),
    duty_min: float | None = Query(None, description="Min duty rate filter"),
    duty_max: float | None = Query(None, description="Max duty rate filter"),
    has_fta: str = Query("", description="Filter items with trade agreements"),
    sort: str = Query("code", description="Sort by: code, chapter, duty"),
    order: str = Query("asc", description="Sort order: asc, desc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
):
    response.headers["Cache-Control"] = CACHE_NONE
    offset = (page - 1) * per_page
    conn = get_db()

    conditions = []
    params: list = []

    if q.strip():
        normalized = q.strip().replace("/", "").replace(" ", "")
        if normalized.isdigit():
            conditions.append("t.code LIKE ?")
            params.append(q.strip() + "%")
        else:
            sanitized = _sanitize_fts_query(q.strip())
            conditions.append(
                "t.id IN (SELECT rowid FROM tariffs_fts WHERE tariffs_fts MATCH ?)"
            )
            params.append(sanitized)

    if chapter:
        chapters = [c.strip().zfill(2) for c in chapter.split(",")]
        if len(chapters) == 1:
            conditions.append("t.chapter = ?")
            params.append(chapters[0])
        else:
            placeholders = ",".join("?" * len(chapters))
            conditions.append(f"t.chapter IN ({placeholders})")
            params.extend(chapters)

    if duty_min is not None or duty_max is not None:
        conditions.append("t.import_duty_numeric >= ? AND t.import_duty_numeric <= ?")
        params.append(duty_min if duty_min is not None else 0)
        params.append(duty_max if duty_max is not None else 9999)

    if has_fta == "true":
        conditions.append(
            "t.code IN (SELECT tx.tariff_code FROM taxes tx WHERE tx.type = 'agreement')"
        )

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    try:
        total = conn.execute(f"SELECT COUNT(*) FROM tariffs t {where}", params).fetchone()[0]
    except sqlite3.OperationalError:
        # FTS syntax error — fall back to LIKE search
        conditions = [c for c in conditions if "tariffs_fts" not in c]
        params = [p for p in params if not isinstance(p, str) or '"' not in p]
        like_q = f"%{q.strip()}%"
        conditions.append("(t.description_ar LIKE ? OR t.short_description_ar LIKE ?)")
        params.extend([like_q, like_q])
        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        total = conn.execute(f"SELECT COUNT(*) FROM tariffs t {where}", params).fetchone()[0]

    sort_dir = "DESC" if order == "desc" else "ASC"
    if sort == "duty":
        sort_clause = f"t.import_duty_numeric {sort_dir}"
    elif sort == "vat":
        sort_clause = f"t.vat_numeric {sort_dir}"
    elif sort == "chapter":
        sort_clause = f"t.chapter {sort_dir}"
    else:
        sort_clause = f"t.code {sort_dir}"

    sql = f"""
        SELECT t.code, t.chapter, t.description_ar, t.short_description_ar
        FROM tariffs t
        {where}
        ORDER BY {sort_clause}
        LIMIT ? OFFSET ?
    """
    rows = conn.execute(sql, [*params, per_page, offset]).fetchall()

    if rows:
        codes = [row["code"] for row in rows]
        placeholders = ",".join("?" * len(codes))
        all_taxes = conn.execute(
            f"SELECT tariff_code, type, label_en, label_ar, rate FROM taxes WHERE tariff_code IN ({placeholders}) ORDER BY sort_order",
            codes,
        ).fetchall()

        taxes_by_code: dict[str, list] = {}
        for t in all_taxes:
            taxes_by_code.setdefault(t["tariff_code"], []).append(t)
    else:
        taxes_by_code = {}

    results = [
        _build_search_item(row, taxes_by_code.get(row["code"], []))
        for row in rows
    ]

    return {
        "results": results,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


@app.get("/api/tariff/{code:path}")
def get_tariff(code: str, response: Response):
    response.headers["Cache-Control"] = CACHE_STATIC
    conn = get_db()

    row = conn.execute(
        "SELECT code, chapter, description_ar, short_description_ar FROM tariffs WHERE code = ?",
        (code,),
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Tariff code not found")

    taxes = conn.execute(
        "SELECT type, label_en, label_ar, rate, rate_note FROM taxes WHERE tariff_code = ? ORDER BY sort_order",
        (code,),
    ).fetchall()

    instructions = conn.execute(
        "SELECT code, text_ar FROM instructions WHERE tariff_code = ? ORDER BY sort_order",
        (code,),
    ).fetchall()

    result = _build_tariff_detail(row, taxes)
    result["instructions"] = [
        {"code": i["code"], "text_ar": i["text_ar"]}
        for i in instructions
    ]
    return result


@app.get("/api/chapters")
def list_chapters(response: Response):
    response.headers["Cache-Control"] = CACHE_STATIC
    conn = get_db()
    rows = conn.execute(
        "SELECT chapter, COUNT(*) as count FROM tariffs GROUP BY chapter ORDER BY chapter"
    ).fetchall()
    return [{"chapter": r["chapter"], "count": r["count"]} for r in rows]


@app.get("/api/tree")
def tree(response: Response, parent: str = Query("", description="Parent code prefix for tree drill-down")):
    """Hierarchical tree view."""
    response.headers["Cache-Control"] = CACHE_STATIC
    conn = get_db()

    if not parent:
        rows = conn.execute(
            "SELECT chapter, COUNT(*) as count FROM tariffs GROUP BY chapter ORDER BY chapter"
        ).fetchall()
        return [
            {"id": r["chapter"], "label": f"Chapter {r['chapter']}", "count": r["count"], "leaf": False}
            for r in rows
        ]

    depth = len(parent.split("/")) if "/" in parent else 1
    prefix = parent + "/" if "/" in parent else parent + "/"

    if depth >= 4:
        rows = conn.execute(
            "SELECT code, short_description_ar FROM tariffs WHERE code LIKE ? ORDER BY code",
            (parent + "/%",),
        ).fetchall()
        return [
            {"id": r["code"], "label": r["short_description_ar"], "count": 0, "leaf": True}
            for r in rows
        ]

    next_len = len(prefix) + 2
    rows = conn.execute(
        """
        SELECT SUBSTR(code, 1, ?) as grp, COUNT(*) as count, MIN(short_description_ar) as sample_desc
        FROM tariffs
        WHERE code LIKE ?
        GROUP BY grp
        ORDER BY grp
        """,
        (next_len, parent + "/%"),
    ).fetchall()

    return [
        {"id": r["grp"], "label": r["sample_desc"], "count": r["count"], "leaf": r["count"] == 1}
        for r in rows
    ]


@app.get("/api/stats")
def stats(response: Response):
    response.headers["Cache-Control"] = CACHE_STATIC
    global _stats_cache
    if _stats_cache is not None:
        return _stats_cache

    conn = get_db()
    counts = conn.execute("""
        SELECT
            (SELECT COUNT(*) FROM tariffs) as tariffs,
            (SELECT COUNT(DISTINCT chapter) FROM tariffs) as chapters,
            (SELECT COUNT(*) FROM taxes) as tax_entries,
            (SELECT COUNT(*) FROM instructions) as instructions
    """).fetchone()

    duty_dist = conn.execute("""
        SELECT
            CASE
                WHEN tx.rate_numeric = 0 OR tx.rate_numeric IS NULL THEN 'Free'
                WHEN tx.rate_numeric BETWEEN 0.1 AND 5 THEN '1-5%'
                WHEN tx.rate_numeric BETWEEN 5.1 AND 10 THEN '5-10%'
                WHEN tx.rate_numeric BETWEEN 10.1 AND 20 THEN '10-20%'
                WHEN tx.rate_numeric BETWEEN 20.1 AND 40 THEN '20-40%'
                WHEN tx.rate_numeric > 40 THEN '40%+'
                ELSE 'Other'
            END as bracket,
            COUNT(*) as count
        FROM taxes tx
        WHERE tx.label_en = 'Import Duty' AND tx.type = 'tax'
        GROUP BY bracket
    """).fetchall()

    mtime = DB_PATH.stat().st_mtime
    last_synced = datetime.fromtimestamp(mtime, tz=timezone.utc).strftime("%Y-%m-%d")

    _stats_cache = {
        "tariffs": counts["tariffs"],
        "chapters": counts["chapters"],
        "tax_entries": counts["tax_entries"],
        "instructions": counts["instructions"],
        "duty_distribution": {r["bracket"]: r["count"] for r in duty_dist},
        "last_synced": last_synced,
    }
    return _stats_cache

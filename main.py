"""Egyptian Customs Tariff Scraper.

Async scraper with concurrency control for https://customs.gov.eg
Discovers all HS tariff codes across 97 chapters, then fetches
full detail (duties, VAT, trade agreements, required documents)
for each code.
"""

import asyncio
import json
import logging
import re
import sys
import time
from pathlib import Path

import aiohttp
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL = "https://customs.gov.eg"
INDEX_URL = f"{BASE_URL}/Services/Tarif"
DETAIL_URL = f"{BASE_URL}/Services/TrfDetails"

CONCURRENCY = 5
RETRIES = 4
BACKOFF_BASE = 2.0
TIMEOUT = 60
THROTTLE = 0.15
CHAPTERS = range(1, 98)
TARIFF_TYPE = 0  # 0 = imports, 1 = exports

OUTPUT_DIR = Path("data")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
# Structured format:  TIME  LEVEL  [phase]  action  ·  detail  ·  detail
#
#   01:30:12  INFO   [discover]  chapter 04 page 2   ·  +10 codes (30 total)
#   01:30:14  WARN   [http]      retry 2/4            ·  timeout  ·  /Services/Tarif?chapterId=7&page=3
#   01:30:15  INFO   [progress]  chapters             ·  20/97 done  ·  18 ok  ·  2 empty
#   01:30:30  INFO   [detail]    batch 3/140 done     ·  48/50 ok  ·  cumulative 148/150

_GREY = "\033[38;5;245m"
_BLUE = "\033[38;5;75m"
_GREEN = "\033[38;5;114m"
_YELLOW = "\033[38;5;221m"
_RED = "\033[38;5;203m"
_BOLD = "\033[1m"
_RESET = "\033[0m"

_LEVEL_STYLES = {
    "DEBUG": _GREY,
    "INFO": _GREEN,
    "WARNING": _YELLOW,
    "ERROR": _RED,
}


class _Formatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        ts = time.strftime("%H:%M:%S", time.localtime(record.created))
        style = _LEVEL_STYLES.get(record.levelname, "")
        lvl = f"{style}{record.levelname:<5}{_RESET}"
        msg = record.getMessage()
        return f"{_GREY}{ts}{_RESET}  {lvl}  {msg}"


def _setup_logging() -> logging.Logger:
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(_Formatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.DEBUG)

    logging.getLogger("aiohttp").setLevel(logging.WARNING)
    logging.getLogger("charset_normalizer").setLevel(logging.WARNING)

    return logging.getLogger("scraper")


log = _setup_logging()


# ---------------------------------------------------------------------------
# Progress tracker
# ---------------------------------------------------------------------------

class Progress:
    def __init__(self, total: int, phase: str, every: int = 10) -> None:
        self.total = total
        self.phase = phase
        self.every = every
        self.done = 0
        self.ok = 0
        self.failed = 0
        self._lock = asyncio.Lock()
        self._t0 = time.monotonic()

    async def tick(self, success: bool) -> None:
        async with self._lock:
            self.done += 1
            if success:
                self.ok += 1
            else:
                self.failed += 1

            if self.done % self.every == 0 or self.done == self.total:
                elapsed = time.monotonic() - self._t0
                rate = self.done / elapsed if elapsed > 0 else 0
                log.info(
                    "%s[progress]%s  %-12s  ·  %d/%d done  ·  %d ok  ·  %d failed  ·  %.1f/s",
                    _BLUE, _RESET, self.phase, self.done, self.total,
                    self.ok, self.failed, rate,
                )


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

def _short_url(params: dict | None) -> str:
    """Compact query string for log readability."""
    if not params:
        return ""
    return "&".join(f"{k}={v}" for k, v in params.items())


async def fetch(
    session: aiohttp.ClientSession,
    url: str,
    sem: asyncio.Semaphore,
    *,
    params: dict | None = None,
) -> str | None:
    qs = _short_url(params)
    for attempt in range(1, RETRIES + 1):
        async with sem:
            await asyncio.sleep(THROTTLE)
            t0 = time.monotonic()
            try:
                async with session.get(
                    url,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=TIMEOUT),
                ) as resp:
                    if resp.status == 200:
                        body = await resp.text()
                        ms = (time.monotonic() - t0) * 1000
                        log.debug(
                            "%s[http]%s      %s 200  ·  %d bytes  ·  %.0fms  ·  %s",
                            _BLUE, _RESET, "GET", len(body), ms, qs,
                        )
                        return body
                    if resp.status == 429:
                        delay = BACKOFF_BASE ** attempt
                        log.warning(
                            "%s[http]%s      rate-limited  ·  backoff %.1fs  ·  %s",
                            _BLUE, _RESET, delay, qs,
                        )
                        await asyncio.sleep(delay)
                        continue
                    log.warning(
                        "%s[http]%s      HTTP %d  ·  attempt %d/%d  ·  %s",
                        _BLUE, _RESET, resp.status, attempt, RETRIES, qs,
                    )
            except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
                ms = (time.monotonic() - t0) * 1000
                log.warning(
                    "%s[http]%s      %s  ·  attempt %d/%d  ·  %.0fms  ·  %s",
                    _BLUE, _RESET, type(exc).__name__, attempt, RETRIES, ms, qs,
                )

            if attempt < RETRIES:
                await asyncio.sleep(BACKOFF_BASE ** attempt)

    log.error(
        "%s[http]%s      GAVE UP  ·  %d attempts exhausted  ·  %s",
        _BLUE, _RESET, RETRIES, qs,
    )
    return None


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------

_CODE_RE = re.compile(r"ShowTariffDetails\((?:&#39;|')([^'&#]+)(?:&#39;|')\)")
_HS_RE = re.compile(r"\b(\d{2}/\d{2}/\d{2}/\d{2}/\d{2})\b")


def parse_codes(html: str) -> list[str]:
    """Extract tariff codes — try onclick first, fall back to HS pattern in table cells."""
    codes = _CODE_RE.findall(html)
    if codes:
        return codes
    # fallback: HS codes from <td> text
    return list(dict.fromkeys(_HS_RE.findall(html)))


def has_next_page(html: str, current_page: int) -> bool:
    soup = BeautifulSoup(html, "lxml")
    for a in soup.find_all("a", href=True):
        m = re.search(r"page=(\d+)", a["href"])
        if m and int(m.group(1)) == current_page + 1:
            return True
    return False


# ---------------------------------------------------------------------------
# Phase 1 — Discovery
# ---------------------------------------------------------------------------

async def discover_chapter(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    chapter: int,
    progress: Progress,
) -> list[str]:
    codes: list[str] = []
    page = 1

    while True:
        params = {"type": TARIFF_TYPE, "chapterId": chapter, "page": page}
        html = await fetch(session, INDEX_URL, sem, params=params)

        if html is None:
            log.warning(
                "%s[discover]%s  chapter %02d page %d  ·  fetch failed, stopping chapter",
                _BLUE, _RESET, chapter, page,
            )
            break

        page_codes = parse_codes(html)
        if not page_codes:
            log.debug(
                "%s[discover]%s  chapter %02d page %d  ·  empty page, chapter complete",
                _BLUE, _RESET, chapter, page,
            )
            break

        codes.extend(page_codes)
        log.debug(
            "%s[discover]%s  chapter %02d page %d  ·  +%d codes (%d total)",
            _BLUE, _RESET, chapter, page, len(page_codes), len(codes),
        )

        if has_next_page(html, page):
            page += 1
        else:
            break

    if codes:
        log.info(
            "%s[discover]%s  chapter %02d done  ·  %d codes  ·  %d pages",
            _BLUE, _RESET, chapter, len(codes), page,
        )

    await progress.tick(bool(codes))
    return codes


async def discover_all(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
) -> list[str]:
    progress = Progress(len(CHAPTERS), "chapters", every=10)
    tasks = [discover_chapter(session, sem, ch, progress) for ch in CHAPTERS]
    results = await asyncio.gather(*tasks)

    seen: set[str] = set()
    codes: list[str] = []
    for chapter_codes in results:
        for code in chapter_codes:
            if code not in seen:
                seen.add(code)
                codes.append(code)
    return codes


# ---------------------------------------------------------------------------
# Phase 2 — Detail fetching
# ---------------------------------------------------------------------------

async def fetch_detail(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    code: str,
    progress: Progress,
) -> dict | None:
    params = {"trfNumber": code, "trfType": TARIFF_TYPE}
    text = await fetch(session, DETAIL_URL, sem, params=params)

    if text is None:
        await progress.tick(False)
        return None
    try:
        data = json.loads(text)
        taxes = " | ".join(data.get("Taxes", []))
        log.debug(
            "%s[detail]%s    %s  ·  %s  ·  %s",
            _BLUE, _RESET, code, data.get("ShortDesc", "?")[:50], taxes[:60],
        )
        await progress.tick(True)
        return data
    except json.JSONDecodeError:
        log.error(
            "%s[detail]%s    %s  ·  bad JSON  ·  %s",
            _BLUE, _RESET, code, text[:120],
        )
        await progress.tick(False)
        return None


async def fetch_all_details(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    codes: list[str],
    *,
    batch_size: int = 50,
) -> list[dict]:
    progress = Progress(len(codes), "details", every=25)
    results: list[dict] = []
    total = len(codes)
    total_batches = (total + batch_size - 1) // batch_size

    for i in range(0, total, batch_size):
        batch = codes[i : i + batch_size]
        batch_num = i // batch_size + 1

        log.info(
            "%s[detail]%s    batch %d/%d start  ·  %d codes  ·  cumulative %d/%d so far",
            _BLUE, _RESET, batch_num, total_batches, len(batch),
            len(results), total,
        )

        tasks = [fetch_detail(session, sem, code, progress) for code in batch]
        batch_results = await asyncio.gather(*tasks)
        hits = [r for r in batch_results if r is not None]
        results.extend(hits)

        log.info(
            "%s[detail]%s    batch %d/%d done   ·  %d/%d ok  ·  cumulative %d/%d",
            _BLUE, _RESET, batch_num, total_batches, len(hits), len(batch),
            len(results), min(i + batch_size, total),
        )

    return results


# ---------------------------------------------------------------------------
# Flat export
# ---------------------------------------------------------------------------

def flatten(records: list[dict]) -> list[dict]:
    rows = []
    for r in records:
        rows.append({
            "code": r.get("Number", ""),
            "description": r.get("Desc", ""),
            "short_description": r.get("ShortDesc", ""),
            "taxes": " | ".join(r.get("Taxes", [])),
            "instruction_codes": ", ".join(r.get("InstructionCodes", [])),
            "instructions": " | ".join(r.get("Instructions", [])),
        })
    return rows


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

async def scrape() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    connector = aiohttp.TCPConnector(limit=CONCURRENCY, limit_per_host=CONCURRENCY)

    log.info(
        "%s[config]%s    concurrency=%d  timeout=%ds  retries=%d  throttle=%.2fs  chapters=%d-%d",
        _BLUE, _RESET, CONCURRENCY, TIMEOUT, RETRIES, THROTTLE,
        CHAPTERS.start, CHAPTERS.stop - 1,
    )

    async with aiohttp.ClientSession(connector=connector) as session:
        # ── Phase 1 ──────────────────────────────────────────────────────
        log.info(
            "%s%s[phase 1]%s   discovering tariff codes across %d chapters …",
            _BOLD, _BLUE, _RESET, len(CHAPTERS),
        )
        t0 = time.monotonic()
        codes = await discover_all(session, sem)
        t_discover = time.monotonic() - t0

        log.info(
            "%s[phase 1]%s   complete  ·  %d unique codes  ·  %.1fs elapsed",
            _BLUE, _RESET, len(codes), t_discover,
        )

        (OUTPUT_DIR / "codes.json").write_text(
            json.dumps(codes, ensure_ascii=False, indent=2),
        )
        log.info("%s[io]%s        saved %s/codes.json", _BLUE, _RESET, OUTPUT_DIR)

        if not codes:
            log.error("%s[phase 1]%s   no codes discovered — aborting", _BLUE, _RESET)
            return

        # ── Phase 2 ──────────────────────────────────────────────────────
        log.info(
            "%s%s[phase 2]%s   fetching details for %d codes …",
            _BOLD, _BLUE, _RESET, len(codes),
        )
        t1 = time.monotonic()
        details = await fetch_all_details(session, sem, codes)
        t_details = time.monotonic() - t1

        failed = len(codes) - len(details)
        log.info(
            "%s[phase 2]%s   complete  ·  %d fetched  ·  %d failed  ·  %.1fs elapsed",
            _BLUE, _RESET, len(details), failed, t_details,
        )

        # ── Persist ──────────────────────────────────────────────────────
        (OUTPUT_DIR / "tariffs.json").write_text(
            json.dumps(details, ensure_ascii=False, indent=2),
        )
        log.info("%s[io]%s        saved %s/tariffs.json", _BLUE, _RESET, OUTPUT_DIR)

        flat = flatten(details)
        (OUTPUT_DIR / "tariffs_flat.json").write_text(
            json.dumps(flat, ensure_ascii=False, indent=2),
        )
        log.info("%s[io]%s        saved %s/tariffs_flat.json", _BLUE, _RESET, OUTPUT_DIR)

        summary = {
            "total_codes": len(codes),
            "details_fetched": len(details),
            "failed": failed,
            "discovery_seconds": round(t_discover, 1),
            "detail_seconds": round(t_details, 1),
            "total_seconds": round(t_discover + t_details, 1),
            "tariff_type": "imports" if TARIFF_TYPE == 0 else "exports",
        }
        (OUTPUT_DIR / "summary.json").write_text(
            json.dumps(summary, ensure_ascii=False, indent=2),
        )

        log.info(
            "%s%s[done]%s      %d codes  ·  %d details  ·  %d failed  ·  %.1fs total",
            _BOLD, _GREEN, _RESET, len(codes), len(details), failed,
            t_discover + t_details,
        )


def main() -> None:
    asyncio.run(scrape())


if __name__ == "__main__":
    main()

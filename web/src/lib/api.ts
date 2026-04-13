// ── Types ──

export interface Tax {
  type: string
  label_en: string
  label_ar: string
  rate: string | null
  rate_note: string | null
}

export interface TariffResult {
  code: string
  chapter: string
  description_ar: string
  short_description_ar: string
  import_duty: string | null
  vat: string | null
  agreement_count: number
}

export interface TariffDetail extends TariffResult {
  agreements: string[]
  taxes: Tax[]
  instructions: { code: string | null; text_ar: string }[]
}

export interface SearchResponse {
  results: TariffResult[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface Chapter {
  chapter: string
  count: number
}

export interface Stats {
  tariffs: number
  chapters: number
  tax_entries: number
  instructions: number
  duty_distribution: Record<string, number>
  last_synced: string
}

export interface SearchParams {
  q?: string
  chapter?: string
  sort?: string
  order?: string
  has_fta?: string
  page?: number
  per_page?: number
}

// ── Raw JSON shape (compact keys from ETL) ──

interface RawTariff {
  c: string   // code
  ch: string  // chapter
  d: string   // description_ar
  s: string   // short_description_ar
  dn: number | null // import_duty_numeric
  vn: number | null // vat_numeric
  tx: { t: string; le: string; la: string; r: string | null; rn: string | null }[]
  ix: { c: string | null; t: string }[]
}

// ── Data store ──

let _data: RawTariff[] | null = null
let _loadPromise: Promise<RawTariff[]> | null = null

async function loadData(): Promise<RawTariff[]> {
  if (_data) return _data
  if (_loadPromise) return _loadPromise

  _loadPromise = fetch(import.meta.env.BASE_URL + "data.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load data: ${res.status}`)
      return res.json()
    })
    .then((json: RawTariff[]) => {
      _data = json
      return json
    })

  return _loadPromise
}

// ── Helpers ──

function extractRate(taxes: RawTariff["tx"], labelEn: string): string | null {
  for (const t of taxes) {
    if (t.le === labelEn && t.r) return t.r
  }
  return null
}

function countAgreements(taxes: RawTariff["tx"]): number {
  let count = 0
  for (const t of taxes) {
    if (t.t === "agreement") count++
  }
  return count
}

function toSearchResult(raw: RawTariff): TariffResult {
  return {
    code: raw.c,
    chapter: raw.ch,
    description_ar: raw.d,
    short_description_ar: raw.s,
    import_duty: extractRate(raw.tx, "Import Duty"),
    vat: extractRate(raw.tx, "VAT"),
    agreement_count: countAgreements(raw.tx),
  }
}

function toDetail(raw: RawTariff): TariffDetail {
  const taxes: Tax[] = raw.tx.map((t) => ({
    type: t.t, label_en: t.le, label_ar: t.la, rate: t.r, rate_note: t.rn,
  }))
  return {
    code: raw.c,
    chapter: raw.ch,
    description_ar: raw.d,
    short_description_ar: raw.s,
    import_duty: extractRate(raw.tx, "Import Duty"),
    vat: extractRate(raw.tx, "VAT"),
    agreement_count: countAgreements(raw.tx),
    agreements: taxes.filter((t) => t.type === "agreement").map((t) => t.label_en),
    taxes,
    instructions: raw.ix.map((i) => ({ code: i.c, text_ar: i.t })),
  }
}

// ── Public API (same interface, client-side implementation) ──

export async function searchTariffs(params: SearchParams, signal?: AbortSignal): Promise<SearchResponse> {
  const data = await loadData()
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError")

  let filtered = data

  // Text search
  if (params.q) {
    const q = params.q.trim()
    const normalized = q.replace(/\//g, "").replace(/\s/g, "")
    if (/^\d+$/.test(normalized)) {
      // HS code prefix match
      filtered = filtered.filter((t) => t.c.startsWith(q))
    } else {
      // Text search in descriptions
      const lower = q.toLowerCase()
      filtered = filtered.filter(
        (t) => t.d.includes(lower) || t.s.includes(lower) || t.d.includes(q) || t.s.includes(q)
      )
    }
  }

  // Chapter filter (single or comma-separated)
  if (params.chapter) {
    const chapters = new Set(params.chapter.split(",").map((c) => c.trim().padStart(2, "0")))
    filtered = filtered.filter((t) => chapters.has(t.ch))
  }

  // FTA filter
  if (params.has_fta === "true") {
    filtered = filtered.filter((t) => t.tx.some((tx) => tx.t === "agreement"))
  }

  // Sort
  const order = params.order === "desc" ? -1 : 1
  const sorted = [...filtered]
  switch (params.sort) {
    case "duty":
      sorted.sort((a, b) => ((a.dn ?? -1) - (b.dn ?? -1)) * order)
      break
    case "vat":
      sorted.sort((a, b) => ((a.vn ?? -1) - (b.vn ?? -1)) * order)
      break
    case "chapter":
      sorted.sort((a, b) => a.ch.localeCompare(b.ch) * order)
      break
    default:
      sorted.sort((a, b) => a.c.localeCompare(b.c) * order)
  }

  // Paginate
  const page = params.page || 1
  const perPage = params.per_page || 25
  const total = sorted.length
  const start = (page - 1) * perPage
  const pageResults = sorted.slice(start, start + perPage)

  return {
    results: pageResults.map(toSearchResult),
    total,
    page,
    per_page: perPage,
    total_pages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function getTariff(code: string): Promise<TariffDetail> {
  const data = await loadData()
  const raw = data.find((t) => t.c === code)
  if (!raw) throw new Error("Not found")
  return toDetail(raw)
}

export async function getChapters(): Promise<Chapter[]> {
  const data = await loadData()
  const counts = new Map<string, number>()
  for (const t of data) {
    counts.set(t.ch, (counts.get(t.ch) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([chapter, count]) => ({ chapter, count }))
    .sort((a, b) => a.chapter.localeCompare(b.chapter))
}

export async function getStats(): Promise<Stats> {
  const data = await loadData()
  let taxEntries = 0
  let instructionCount = 0
  const dutyDist: Record<string, number> = {}

  for (const t of data) {
    taxEntries += t.tx.length
    instructionCount += t.ix.length

    if (t.dn !== null) {
      let bracket: string
      if (t.dn === 0) bracket = "Free"
      else if (t.dn <= 5) bracket = "1-5%"
      else if (t.dn <= 10) bracket = "5-10%"
      else if (t.dn <= 20) bracket = "10-20%"
      else if (t.dn <= 40) bracket = "20-40%"
      else bracket = "40%+"
      dutyDist[bracket] = (dutyDist[bracket] ?? 0) + 1
    }
  }

  const chapters = new Set(data.map((t) => t.ch))

  return {
    tariffs: data.length,
    chapters: chapters.size,
    tax_entries: taxEntries,
    instructions: instructionCount,
    duty_distribution: dutyDist,
    last_synced: new Date().toISOString().split("T")[0],
  }
}

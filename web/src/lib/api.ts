const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

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

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

export async function searchTariffs(params: SearchParams, signal?: AbortSignal): Promise<SearchResponse> {
  const sp = new URLSearchParams()
  if (params.q) sp.set("q", params.q)
  if (params.chapter) sp.set("chapter", params.chapter)
  if (params.sort) sp.set("sort", params.sort)
  if (params.order) sp.set("order", params.order)
  if (params.has_fta) sp.set("has_fta", params.has_fta)
  sp.set("page", String(params.page || 1))
  sp.set("per_page", String(params.per_page || 25))
  return fetchJSON<SearchResponse>(`${API_BASE}/api/search?${sp}`, signal)
}

const _detailCache = new Map<string, TariffDetail>()

export async function getTariff(code: string): Promise<TariffDetail> {
  const cached = _detailCache.get(code)
  if (cached) return cached
  const detail = await fetchJSON<TariffDetail>(`${API_BASE}/api/tariff/${encodeURIComponent(code)}`)
  _detailCache.set(code, detail)
  return detail
}

export async function getChapters(): Promise<Chapter[]> {
  return fetchJSON<Chapter[]>(`${API_BASE}/api/chapters`)
}

export async function getStats(): Promise<Stats> {
  return fetchJSON<Stats>(`${API_BASE}/api/stats`)
}

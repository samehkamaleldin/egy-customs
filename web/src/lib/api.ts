const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export interface Tax {
  type: string
  label_en: string
  label_ar: string
  rate: string | null
}

export interface TariffResult {
  code: string
  chapter: string
  description_ar: string
  short_description_ar: string
  import_duty: string | null
  vat: string | null
  agreements: string[]
  taxes: Tax[]
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

export async function searchTariffs(params: SearchParams): Promise<SearchResponse> {
  const sp = new URLSearchParams()
  if (params.q) sp.set("q", params.q)
  if (params.chapter) sp.set("chapter", params.chapter)
  if (params.sort) sp.set("sort", params.sort)
  if (params.order) sp.set("order", params.order)
  if (params.has_fta) sp.set("has_fta", params.has_fta)
  sp.set("page", String(params.page || 1))
  sp.set("per_page", String(params.per_page || 25))
  const res = await fetch(`${API_BASE}/api/search?${sp}`)
  return res.json()
}

export async function getTariff(code: string): Promise<TariffDetail> {
  const res = await fetch(`${API_BASE}/api/tariff/${encodeURIComponent(code)}`)
  return res.json()
}

export async function getChapters(): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/api/chapters`)
  return res.json()
}

export async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats`)
  return res.json()
}

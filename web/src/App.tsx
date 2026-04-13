import { useCallback, useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SearchInput } from "@/components/search-input"
import { TariffDetailDialog } from "@/components/tariff-detail"
import { TariffTable } from "@/components/tariff-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import type { Chapter, SearchResponse, Stats } from "@/lib/api"
import { getChapters, getStats, searchTariffs } from "@/lib/api"
import { t, tChapter, fmt } from "@/lib/i18n"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon, FilterIcon, ArrowLeft01Icon, ArrowRight01Icon,
} from "@hugeicons/core-free-icons"

export default function App() {
  const [query, setQuery] = useState("")
  const [chapter, setChapter] = useState("")
  const [sort, setSort] = useState("code")
  const [order, setOrder] = useState<"asc" | "desc">("asc")
  const [hasFta, setHasFta] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCode, setSelectedCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get("code")
  })

  useEffect(() => {
    getChapters().then(setChapters)
    getStats().then(setStats)
  }, [])

  const doSearch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await searchTariffs({
        q: query, chapter, sort, order,
        has_fta: hasFta ? "true" : "",
        page, per_page: perPage,
      })
      setData(res)
    } finally {
      setLoading(false)
    }
  }, [query, chapter, sort, order, hasFta, page, perPage])

  useEffect(() => { doSearch() }, [doSearch])

  function handleSort(col: string) {
    if (sort === col) setOrder(order === "asc" ? "desc" : "asc")
    else { setSort(col); setOrder("asc") }
    setPage(1)
  }

  const hasFilters = !!query || !!chapter || hasFta
  const from = data ? (data.page - 1) * data.per_page + 1 : 0
  const to = data ? Math.min(data.page * data.per_page, data.total) : 0

  return (
    <SidebarProvider>
      <AppSidebar
        chapters={chapters}
        selected={chapter}
        onSelect={(ch) => { setChapter(ch); setPage(1) }}
      />
      <SidebarInset className="h-svh overflow-hidden">
        {/* ─── Header ─── */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-2 !h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{t("nav.tariffSchedule")}</BreadcrumbPage>
              </BreadcrumbItem>
              {chapter && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {t("nav.chapter")} {chapter} · {tChapter(chapter)}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          {stats && (
            <div className="ms-auto hidden md:flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
              <span>
                <strong className="text-foreground">{fmt(stats.tariffs)}</strong>{" "}
                {t("results.codes")}
              </span>
              <span>
                <strong className="text-foreground">{fmt(stats.chapters)}</strong>{" "}
                {t("results.chapters")}
              </span>
            </div>
          )}
        </header>

        {/* ─── Content ─── */}
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          {/* Search + filter bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 max-w-lg">
              <SearchInput
                value={query}
                onChange={(v) => { setQuery(v); setPage(1) }}
              />
            </div>
            <Button
              variant={hasFta ? "default" : "outline"}
              size="sm"
              onClick={() => { setHasFta(!hasFta); setPage(1) }}
              className="transition-colors duration-150"
            >
              <HugeiconsIcon icon={FilterIcon} size={14} />
              {t("filter.tradeAgreements")}
            </Button>
          </div>

          {/* Active filters */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap" role="status" aria-live="polite">
              <span className="text-xs text-muted-foreground">{t("filter.activeFilters")}</span>
              {chapter && (
                <FilterPill
                  label={`${t("nav.chapter")} ${chapter} · ${tChapter(chapter)}`}
                  onRemove={() => { setChapter(""); setPage(1) }}
                />
              )}
              {query && (
                <FilterPill
                  label={`"${query}"`}
                  onRemove={() => { setQuery(""); setPage(1) }}
                />
              )}
              {hasFta && (
                <FilterPill
                  label={t("filter.ftaOnly")}
                  onRemove={() => { setHasFta(false); setPage(1) }}
                />
              )}
            </div>
          )}

          {/* Results card */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col min-h-0 flex-1">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 h-11 border-b">
              <span className="text-sm text-muted-foreground tabular-nums">
                <strong className="text-foreground">{fmt(data?.total ?? 0)}</strong>{" "}
                {t("results.count")}
              </span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(parseInt(e.target.value)); setPage(1) }}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs cursor-pointer transition-colors duration-150 hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                aria-label={t("results.perPage")}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} {t("results.perPage")}</option>
                ))}
              </select>
            </div>

            {/* Table — thead is sticky, tbody scrolls */}
            <div className={`flex-1 min-h-0 overflow-auto transition-opacity duration-200 ease-out ${loading ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
              {data && (
                <TariffTable
                  results={data.results}
                  onSelect={setSelectedCode}
                  onChapterClick={(ch) => { setChapter(ch); setPage(1) }}
                  sort={sort}
                  order={order}
                  onSort={handleSort}
                />
              )}
            </div>

            {/* Pagination */}
            {data && data.total > 0 && (
              <div className="flex items-center justify-between px-4 h-11 border-t text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {fmt(from)}–{fmt(to)} {t("results.of")} {fmt(data.total)}
                </span>
                <nav className="flex items-center gap-1" aria-label="pagination">
                  <Button
                    variant="outline" size="icon" className="size-7"
                    onClick={() => setPage(page - 1)} disabled={page <= 1}
                    aria-label="الصفحة السابقة"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Button>
                  {pageRange(page, data.total_pages).map((p, i) =>
                    p === null ? (
                      <span key={`gap-${i}`} className="w-7 text-center select-none" aria-hidden>…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="icon"
                        className="size-7 text-xs tabular-nums"
                        onClick={() => setPage(p)}
                        aria-label={`صفحة ${p}`}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="outline" size="icon" className="size-7"
                    onClick={() => setPage(page + 1)} disabled={page >= data.total_pages}
                    aria-label="الصفحة التالية"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>

      <TariffDetailDialog code={selectedCode} onClose={() => setSelectedCode(null)} />
    </SidebarProvider>
  )
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pe-1">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 transition-colors duration-150 hover:bg-foreground/10 active:bg-foreground/20"
        aria-label={`إزالة: ${label}`}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={12} />
      </button>
    </Badge>
  )
}

function pageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | null)[] = [1]
  if (current > 3) pages.push(null)
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push(null)
  pages.push(total)
  return pages
}

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SearchInput } from "@/components/search-input"
import { TariffTable } from "@/components/tariff-table"

const TariffDetailDialog = lazy(() =>
  import("@/components/tariff-detail").then((m) => ({ default: m.TariffDetailDialog }))
)
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import type { Chapter, SearchResponse, Stats } from "@/lib/api"
import { getChapters, getStats, searchTariffs } from "@/lib/api"
import { getSectionNameForChapters } from "@/lib/chapters"
import { t, tChapter, tSection, fmt, fmtDateAr } from "@/lib/i18n"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon, FilterIcon, ArrowLeft01Icon, ArrowRight01Icon, Loading03Icon,
  DatabaseIcon, Notebook01Icon, Invoice03Icon, Alert02Icon, AlertDiamondIcon,
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
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    getChapters().then(setChapters).catch(() => {})
    getStats().then(setStats).catch(() => {})
  }, [])

  const doSearch = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const res = await searchTariffs({
        q: query, chapter, sort, order,
        has_fta: hasFta ? "true" : "",
        page, per_page: perPage,
      }, controller.signal)
      setData(res)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
    } finally {
      setLoading(false)
    }
  }, [query, chapter, sort, order, hasFta, page, perPage])

  useEffect(() => { doSearch() }, [doSearch])

  const handleChapterSelect = useCallback((ch: string) => {
    setChapter(ch)
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((v: string) => {
    setQuery(v)
    setPage(1)
  }, [])

  const handleChapterClick = useCallback((ch: string) => {
    setChapter(ch)
    setPage(1)
  }, [])

  const sortRef = useRef(sort)
  const orderRef = useRef(order)
  sortRef.current = sort
  orderRef.current = order

  const handleSort = useCallback((col: string) => {
    if (sortRef.current === col) {
      setOrder(orderRef.current === "asc" ? "desc" : "asc")
    } else {
      setSort(col)
      setOrder("asc")
    }
    setPage(1)
  }, [])

  const handleFtaToggle = useCallback(() => {
    setHasFta((v) => !v)
    setPage(1)
  }, [])

  const handlePerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPerPage(parseInt(e.target.value))
    setPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setQuery("")
    setChapter("")
    setHasFta(false)
    setPage(1)
  }, [])

  const handleDetailClose = useCallback(() => setSelectedCode(null), [])

  const hasFilters = !!query || !!chapter || hasFta
  const from = data ? (data.page - 1) * data.per_page + 1 : 0
  const to = data ? Math.min(data.page * data.per_page, data.total) : 0

  const breadcrumbLabel = useMemo(() => {
    if (!chapter) return null
    return chapter.includes(",")
      ? tSection(getSectionNameForChapters(chapter.split(",")))
      : `${t("nav.chapter")} ${chapter} · ${tChapter(chapter)}`
  }, [chapter])

  const filterPillLabel = useMemo(() => {
    if (!chapter) return ""
    return chapter.includes(",")
      ? tSection(getSectionNameForChapters(chapter.split(",")))
      : `${t("nav.chapter")} ${chapter} · ${tChapter(chapter)}`
  }, [chapter])

  return (
    <SidebarProvider>
      {/* Skip link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        {t("a11y.skipToContent")}
      </a>

      <AppSidebar
        chapters={chapters}
        selected={chapter}
        onSelect={handleChapterSelect}
      />
      <SidebarInset className="h-svh overflow-hidden">
        <h1 className="sr-only">{t("app.title")} — {t("app.subtitle")}</h1>

        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="me-2 !h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{t("nav.tariffSchedule")}</BreadcrumbPage>
              </BreadcrumbItem>
              {breadcrumbLabel && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ms-auto flex items-center gap-2">
            {stats?.last_synced && (
              <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Loading03Icon} size={12} className="shrink-0" />
                <span className="whitespace-nowrap">{t("disclaimer.lastSync")} {fmtDateAr(stats.last_synced)}</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
              <HugeiconsIcon icon={AlertDiamondIcon} size={14} className="shrink-0" />
              <span>{t("disclaimer.header")}</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main id="main-content" className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          {/* Search bar + Stats strip */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            {/* Search + FTA filter — first in RTL (right side) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1 lg:max-w-lg">
              <div className="flex-1">
                <SearchInput
                  value={query}
                  onChange={handleSearchChange}
                />
              </div>
              <Button
                variant={hasFta ? "default" : "outline"}
                size="sm"
                onClick={handleFtaToggle}
                aria-pressed={hasFta}
                className="transition-colors duration-150 shrink-0"
              >
                <HugeiconsIcon icon={FilterIcon} size={14} />
                {t("filter.tradeAgreements")}
              </Button>
            </div>

            {/* Stats chips — pushed to left side in RTL */}
            {stats && (
              <div className="flex items-center gap-2 flex-wrap lg:ms-auto">
                <StatChip icon={DatabaseIcon} value={fmt(stats.tariffs)} label={t("results.codes")} />
                <StatChip icon={Notebook01Icon} value={fmt(stats.chapters)} label={t("results.chapters")} />
                <StatChip icon={Invoice03Icon} value={fmt(stats.tax_entries)} label={t("stats.taxEntries")} />
                <StatChip icon={Alert02Icon} value={fmt(stats.instructions)} label={t("stats.instructions")} />
              </div>
            )}
          </div>

          {/* Active filters */}
          <div role="status" aria-live="polite">
            {hasFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{t("filter.activeFilters")}</span>
                {chapter && (
                  <FilterPill
                    label={filterPillLabel}
                    onRemove={handleChapterSelect.bind(null, "")}
                  />
                )}
                {query && (
                  <FilterPill
                    label={`"${query}"`}
                    onRemove={handleSearchChange.bind(null, "")}
                  />
                )}
                {hasFta && (
                  <FilterPill
                    label={t("filter.ftaOnly")}
                    onRemove={handleFtaToggle}
                  />
                )}
              </div>
            )}
          </div>

          {/* Results card */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col min-h-0 flex-1">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 h-11 border-b">
              <span className="text-sm text-muted-foreground tabular-nums">
                {loading && (
                  <HugeiconsIcon icon={Loading03Icon} size={14} className="inline-block animate-spin me-1.5 align-text-bottom" />
                )}
                <strong className="text-foreground">{fmt(data?.total ?? 0)}</strong>{" "}
                {t("results.count")}
              </span>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer transition-colors duration-150 hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                aria-label={t("results.perPage")}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} {t("results.perPage")}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div
              className={`flex-1 min-h-0 overflow-auto transition-opacity duration-200 ease-out ${loading ? "opacity-30 pointer-events-none" : "opacity-100"}`}
              aria-busy={loading}
            >
              {data && (
                <TariffTable
                  results={data.results}
                  onSelect={setSelectedCode}
                  onChapterClick={handleChapterClick}
                  onClearFilters={handleClearFilters}
                  hasFilters={hasFilters}
                  sort={sort}
                  order={order}
                  onSort={handleSort}
                />
              )}
            </div>

            {/* Pagination */}
            {data && data.total > 0 && (
              <div className="flex items-center justify-between px-4 h-11 border-t text-xs text-muted-foreground">
                <span className="tabular-nums" dir="ltr">
                  {fmt(from)}–{fmt(to)} {t("results.of")} {fmt(data.total)}
                </span>
                <nav className="flex items-center gap-1" aria-label={t("pagination.label")}>
                  <Button
                    variant="outline" size="icon" className="size-8"
                    onClick={() => setPage(page - 1)} disabled={page <= 1}
                    aria-label={t("pagination.prev")}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Button>
                  {pageRange(page, data.total_pages).map((p, i) =>
                    p === null ? (
                      <span key={`gap-${i}`} className="w-8 text-center select-none" aria-hidden>…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="icon"
                        className="size-8 text-xs tabular-nums"
                        onClick={() => setPage(p)}
                        aria-label={`${t("pagination.page")} ${p}`}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="outline" size="icon" className="size-8"
                    onClick={() => setPage(page + 1)} disabled={page >= data.total_pages}
                    aria-label={t("pagination.next")}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>

      <Suspense fallback={null}>
        <TariffDetailDialog code={selectedCode} onClose={handleDetailClose} />
      </Suspense>
    </SidebarProvider>
  )
}

function StatChip({ icon, value, label }: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  value: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs">
      <HugeiconsIcon icon={icon} size={14} className="text-muted-foreground shrink-0" />
      <span className="font-bold tabular-nums" dir="ltr">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pe-1">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-1 transition-colors duration-150 hover:bg-foreground/10 active:bg-foreground/20"
        aria-label={`${t("filter.remove")} ${label}`}
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

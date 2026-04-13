import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClickableBadge } from "@/components/ui/clickable-badge"
import type { TariffResult } from "@/lib/api"
import { getIconForChapter, getBadgeClassForChapter, govLink } from "@/lib/chapters"
import { t, tChapter } from "@/lib/i18n"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUp01Icon, ArrowDown01Icon, SortingIcon, LinkSquare02Icon,
  Search01Icon, Cancel01Icon,
} from "@hugeicons/core-free-icons"

interface TariffTableProps {
  results: TariffResult[]
  onSelect: (code: string) => void
  onChapterClick: (chapter: string) => void
  onClearFilters?: () => void
  hasFilters?: boolean
  sort: string
  order: string
  onSort: (column: string) => void
}

export const TariffTable = memo(function TariffTable({ results, onSelect, onChapterClick, onClearFilters, hasFilters, sort, order, onSort }: TariffTableProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
        <div className="flex items-center justify-center size-12 rounded-2xl bg-muted">
          <HugeiconsIcon icon={Search01Icon} size={24} className="opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold">{t("table.noResults")}</p>
          <p className="text-xs mt-1 text-muted-foreground/70">{t("table.noResultsHint")}</p>
        </div>
        {hasFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
            {t("filter.clearAll")}
          </Button>
        )}
      </div>
    )
  }

  const sortProps = (column: string) => {
    const active = sort === column
    return { "aria-sort": active ? (order === "asc" ? "ascending" : "descending") as const : ("none" as const) }
  }

  return (
    <table className="w-full text-sm" aria-label={t("nav.tariffSchedule")}>
      <thead className="sticky top-0 z-10 bg-card text-xs text-muted-foreground shadow-[0_1px_0_0_var(--color-border)]">
        <tr>
          <th className="w-[140px] px-4 py-2.5 text-start hidden md:table-cell" {...sortProps("code")}>
            <SortButton label={t("table.hsCode")} column="code" sort={sort} order={order} onSort={onSort} />
          </th>
          <th className="px-4 py-2.5 text-start">{t("table.description")}</th>
          <th className="w-[150px] px-4 py-2.5 text-center hidden lg:table-cell">{t("table.category")}</th>
          <th className="w-[110px] px-4 py-2.5 text-center" {...sortProps("duty")}>
            <SortButton label={t("table.importDuty")} column="duty" sort={sort} order={order} onSort={onSort} className="justify-center" />
          </th>
          <th className="w-[80px] px-4 py-2.5 text-center" {...sortProps("vat")}>
            <SortButton label={t("table.vat")} column="vat" sort={sort} order={order} onSort={onSort} className="justify-center" />
          </th>
          <th className="w-[100px] px-4 py-2.5 text-center hidden md:table-cell">{t("table.fta")}</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr
            key={r.code}
            tabIndex={0}
            className="border-b border-border/50 cursor-pointer transition-colors duration-150 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
            onClick={() => onSelect(r.code)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.code) } }}
          >
            <td className="px-4 py-2.5 font-mono text-sm text-primary whitespace-nowrap hidden md:table-cell" dir="ltr">
              {r.code}
            </td>
            <td className="px-4 py-2.5 truncate max-w-0">
              <span className="line-clamp-1">{r.short_description_ar}</span>
            </td>
            <td className="px-4 py-2.5 text-center hidden lg:table-cell">
              <ClickableBadge
                className={getBadgeClassForChapter(r.chapter)}
                onClick={(e) => { e.stopPropagation(); onChapterClick(r.chapter) }}
              >
                <HugeiconsIcon icon={getIconForChapter(r.chapter)} size={12} className="shrink-0" />
                {tChapter(r.chapter)}
              </ClickableBadge>
            </td>
            <td className="px-4 py-2.5 text-center">
              <DutyDisplay rate={r.import_duty} />
            </td>
            <td className="px-4 py-2.5 text-center font-mono text-xs text-muted-foreground" dir="ltr">
              {r.vat || "—"}
            </td>
            <td className="px-4 py-2.5 text-center hidden md:table-cell">
              <span className="inline-flex items-center gap-1.5">
                {r.agreement_count > 0 && (
                  <Badge variant="secondary">{r.agreement_count}</Badge>
                )}
                <a
                  href={govLink(r.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("detail.viewOnGov")}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
                  aria-label={t("detail.viewOnGov")}
                >
                  <HugeiconsIcon icon={LinkSquare02Icon} size={13} />
                </a>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
})

function SortButton({
  label, column, sort, order, onSort, className = "",
}: {
  label: string; column: string; sort: string; order: string
  onSort: (col: string) => void; className?: string
}) {
  const active = sort === column
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 select-none transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:rounded-sm ${active ? "text-foreground" : ""} ${className}`}
      onClick={(e) => { e.stopPropagation(); onSort(column) }}
    >
      {label}
      <HugeiconsIcon
        icon={active ? (order === "asc" ? ArrowUp01Icon : ArrowDown01Icon) : SortingIcon}
        size={14}
        className={active ? "" : "opacity-30"}
      />
    </button>
  )
}

function DutyDisplay({ rate }: { rate: string | null }) {
  if (!rate) return <span className="text-xs text-muted-foreground">—</span>
  const isFree = rate === "0%" || rate.startsWith("0%")
  if (isFree) {
    return (
      <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
        {t("table.free")}
      </Badge>
    )
  }
  return <span className="font-mono text-sm tabular-nums" dir="ltr">{rate}</span>
}

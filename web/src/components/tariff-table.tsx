import { Badge } from "@/components/ui/badge"
import { ClickableBadge } from "@/components/ui/clickable-badge"
import type { TariffResult } from "@/lib/api"
import { getIconForChapter, getBadgeClassForChapter, govLink } from "@/lib/chapters"
import { t, tChapter } from "@/lib/i18n"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUp01Icon, ArrowDown01Icon, SortingIcon, LinkSquare02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

interface TariffTableProps {
  results: TariffResult[]
  onSelect: (code: string) => void
  onChapterClick: (chapter: string) => void
  sort: string
  order: string
  onSort: (column: string) => void
}

export function TariffTable({ results, onSelect, onChapterClick, sort, order, onSort }: TariffTableProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
        <div className="flex items-center justify-center size-12 rounded-2xl bg-muted">
          <HugeiconsIcon icon={Search01Icon} size={24} className="opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{t("table.noResults")}</p>
          <p className="text-xs mt-1 text-muted-foreground/70">{t("table.noResultsHint")}</p>
        </div>
      </div>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10 bg-card text-xs font-medium text-muted-foreground shadow-[0_1px_0_0_var(--color-border)]">
        <tr>
          <th className="w-[140px] px-4 py-2.5 text-start font-medium">
            <SortableLabel label={t("table.hsCode")} column="code" sort={sort} order={order} onSort={onSort} />
          </th>
          <th className="px-3 py-2.5 text-start font-medium">{t("table.description")}</th>
          <th className="w-[150px] px-3 py-2.5 text-center font-medium hidden lg:table-cell">{t("table.category")}</th>
          <th className="w-[110px] px-3 py-2.5 text-center font-medium">
            <SortableLabel label={t("table.importDuty")} column="duty" sort={sort} order={order} onSort={onSort} className="justify-center" />
          </th>
          <th className="w-[80px] px-3 py-2.5 text-center font-medium hidden md:table-cell">{t("table.vat")}</th>
          <th className="w-[100px] px-3 py-2.5 text-center font-medium hidden sm:table-cell">{t("table.fta")}</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr
            key={r.code}
            className="border-b border-border/50 cursor-pointer transition-colors duration-150 hover:bg-muted/50"
            onClick={() => onSelect(r.code)}
          >
            <td className="px-4 py-2.5 font-mono text-sm font-medium text-primary whitespace-nowrap" dir="ltr">
              {r.code}
            </td>
            <td className="px-3 py-2.5 truncate max-w-0">
              {r.short_description_ar}
            </td>
            <td className="px-3 py-2.5 text-center hidden lg:table-cell">
              <ClickableBadge
                className={getBadgeClassForChapter(r.chapter)}
                onClick={(e) => { e.stopPropagation(); onChapterClick(r.chapter) }}
              >
                <HugeiconsIcon icon={getIconForChapter(r.chapter)} size={12} className="shrink-0" />
                {tChapter(r.chapter)}
              </ClickableBadge>
            </td>
            <td className="px-3 py-2.5 text-center">
              <DutyDisplay rate={r.import_duty} />
            </td>
            <td className="px-3 py-2.5 text-center font-mono text-xs text-muted-foreground hidden md:table-cell" dir="ltr">
              {r.vat || "—"}
            </td>
            <td className="px-3 py-2.5 text-center hidden sm:table-cell">
              <span className="inline-flex items-center gap-1.5">
                {r.agreements.length > 0 && (
                  <Badge variant="secondary">{r.agreements.length}</Badge>
                )}
                <a
                  href={govLink(r.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("detail.viewOnGov")}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
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
}

function SortableLabel({
  label, column, sort, order, onSort, className = "",
}: {
  label: string; column: string; sort: string; order: string
  onSort: (col: string) => void; className?: string
}) {
  const active = sort === column
  return (
    <span
      className={`inline-flex items-center gap-1 cursor-pointer select-none transition-colors duration-150 hover:text-foreground ${className}`}
      onClick={(e) => { e.stopPropagation(); onSort(column) }}
      role="button"
      aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      <HugeiconsIcon
        icon={active ? (order === "asc" ? ArrowUp01Icon : ArrowDown01Icon) : SortingIcon}
        size={14}
        className={`transition-opacity duration-150 ${active ? "" : "opacity-30"}`}
      />
    </span>
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

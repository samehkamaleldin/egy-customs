import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { Tax, TariffDetail } from "@/lib/api"
import { getTariff } from "@/lib/api"
import { getColorForChapter, getIconForChapter, getSectionForChapter, getBadgeClassForChapter, govLink } from "@/lib/chapters"
import { t, tChapter, tSection, fmtEGP } from "@/lib/i18n"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LinkSquare02Icon, InformationCircleIcon,
  Invoice03Icon, Agreement02Icon, Alert02Icon,
  PercentIcon, MoneyReceiveFlow02Icon, ShieldKeyIcon,
} from "@hugeicons/core-free-icons"
import { useEffect, useState } from "react"

interface Props {
  code: string | null
  onClose: () => void
}

const EXAMPLE_BASE = 100_000

export function TariffDetailDialog({ code, onClose }: Props) {
  const [detail, setDetail] = useState<TariffDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!code) { setDetail(null); return }
    setLoading(true)
    getTariff(code)
      .then(setDetail)
      .catch(() => { setDetail(null) })
      .finally(() => setLoading(false))
  }, [code])

  const mainTaxes = detail?.taxes.filter((t) => t.type === "tax" && t.rate) || []
  const agreements = detail?.taxes.filter((t) => t.type === "agreement") || []

  return (
    <Dialog open={!!code} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-full" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Skeleton className="h-24" /><Skeleton className="h-24" />
            </div>
          </div>
        ) : detail ? (
          <>
            {/* Hero */}
            <div className="p-4 sm:p-6 pb-0">
              <DialogHeader>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`flex items-center justify-center size-10 sm:size-14 rounded-xl sm:rounded-2xl shrink-0 ${getColorForChapter(detail.chapter)} text-white`}>
                    <HugeiconsIcon icon={getIconForChapter(detail.chapter)} size={20} className="sm:hidden" />
                    <HugeiconsIcon icon={getIconForChapter(detail.chapter)} size={28} className="hidden sm:block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base sm:text-xl font-bold leading-relaxed">
                      {detail.description_ar}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      {t("detail.dialogDescription")} {detail.code}
                    </DialogDescription>
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <Badge variant="outline" className="font-mono text-xs" dir="ltr">{detail.code}</Badge>
                      <Badge variant="outline" className={getBadgeClassForChapter(detail.chapter)}>
                        {t("nav.chapter")} {detail.chapter} · {tChapter(detail.chapter)}
                      </Badge>
                      <Badge variant="outline" className={`hidden sm:inline-flex ${getBadgeClassForChapter(detail.chapter)}`}>
                        {tSection(getSectionForChapter(detail.chapter))}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Quick stats */}
            <div className="px-4 sm:px-6 pt-4 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <StatCard
                  icon={PercentIcon}
                  label={t("table.importDuty")}
                  value={detail.import_duty || "—"}
                  highlight={detail.import_duty === "0%" || detail.import_duty?.startsWith("0%")}
                />
                <StatCard
                  icon={MoneyReceiveFlow02Icon}
                  label={t("table.vat")}
                  value={detail.vat || "—"}
                />
                <StatCard
                  icon={Agreement02Icon}
                  label={t("detail.tradeAgreements")}
                  value={agreements.length > 0 ? String(agreements.length) : "—"}
                />
                <StatCard
                  icon={Alert02Icon}
                  label={t("detail.regulations")}
                  value={detail.instructions.length > 0 ? String(detail.instructions.length) : "—"}
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 py-2">
              <Button variant="outline" size="sm" asChild>
                <a href={govLink(detail.code)} target="_blank" rel="noopener noreferrer">
                  <HugeiconsIcon icon={LinkSquare02Icon} size={14} />
                  {t("detail.viewOnGov")}
                </a>
              </Button>
            </div>

            <Separator className="mx-4 sm:mx-6" />

            {/* Bill */}
            <div className="p-4 sm:p-6 space-y-6">
              <section>
                <SectionHeading icon={Invoice03Icon} label={t("detail.dutiesTaxes")} color="bg-primary" />

                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Bill header */}
                    <div className="flex items-center bg-muted/60 px-3 sm:px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <div className="flex-1">{t("detail.type")}</div>
                      <div className="w-16 sm:w-28 text-center">{t("detail.rate")}</div>
                      <div className="w-20 sm:w-36 text-start hidden sm:block" dir="ltr">{t("detail.example")}</div>
                    </div>

                    <BillRows taxes={mainTaxes} base={EXAMPLE_BASE} />
                  </CardContent>
                </Card>

                {mainTaxes.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1.5">
                    <HugeiconsIcon icon={InformationCircleIcon} size={13} className="shrink-0 mt-0.5" />
                    <span>{t("detail.disclaimer")} {fmtEGP(EXAMPLE_BASE)}</span>
                  </p>
                )}
              </section>

              {/* Trade agreements */}
              {agreements.length > 0 && (
                <section>
                  <SectionHeading icon={ShieldKeyIcon} label={t("detail.tradeAgreements")} color="bg-teal-500" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {agreements.map((a, i) => {
                      const idx = detail.taxes.indexOf(a)
                      const rates: { rate: string }[] = []
                      for (let j = idx + 1; j < detail.taxes.length; j++) {
                        if (detail.taxes[j].type === "agreement") break
                        if (detail.taxes[j].type === "tax" && detail.taxes[j].label_en.includes("(")) {
                          rates.push({ rate: detail.taxes[j].rate ?? "" })
                        }
                      }
                      return (
                        <Card key={i}>
                          <CardContent className="flex items-center justify-between p-3">
                            <span className="text-sm truncate me-2">{a.label_ar}</span>
                            <div className="flex gap-1.5 shrink-0">
                              {rates.map((r, j) => (
                                <Badge key={j} variant="outline" className="font-mono text-teal-600 border-teal-300 bg-teal-50 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800" dir="ltr">
                                  {r.rate}
                                </Badge>
                              ))}
                              {rates.length === 0 && (
                                <Badge variant="outline" className="text-teal-600 border-teal-300 bg-teal-50 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800">
                                  {t("table.free")}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Regulations */}
              {detail.instructions.length > 0 && (
                <section>
                  <SectionHeading icon={Alert02Icon} label={t("detail.regulations")} color="bg-amber-500" count={detail.instructions.length} />
                  <Card className="overflow-hidden">
                    <CardContent className="p-0 divide-y">
                      {detail.instructions.map((inst, i) => (
                        <div key={i} className="flex gap-3 px-3 sm:px-5 py-3">
                          {inst.code && (
                            <Badge variant="outline" className="shrink-0 h-fit font-mono text-[11px] mt-0.5" dir="ltr">
                              {inst.code}
                            </Badge>
                          )}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {inst.text_ar}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </section>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/* Helpers */

function SectionHeading({ icon, label, color, count }: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  label: string
  color: string
  count?: number
}) {
  return (
    <h3 className="flex items-center gap-2.5 text-sm font-bold mb-3">
      <span className={`flex items-center justify-center size-6 rounded-md ${color} text-white`}>
        <HugeiconsIcon icon={icon} size={14} />
      </span>
      {label}
      {count != null && <Badge variant="secondary">{count}</Badge>}
    </h3>
  )
}

function StatCard({ icon, label, value, highlight }: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-2 sm:p-3 flex flex-col items-center gap-1">
      <HugeiconsIcon icon={icon} size={14} className="text-muted-foreground" />
      <div className={`text-lg sm:text-xl font-mono font-bold leading-none ${highlight ? "text-emerald-500" : ""}`} dir="ltr">
        {value}
      </div>
      <div className="text-[10px] sm:text-[11px] text-muted-foreground text-center leading-tight">{label}</div>
    </div>
  )
}

function BillRows({ taxes, base }: { taxes: Tax[]; base: number }) {
  if (taxes.length === 0) {
    return <div className="px-3 sm:px-5 py-6 text-center text-sm text-muted-foreground">—</div>
  }

  const { amounts, total } = computeBill(taxes, base)
  const notes = [...new Set(taxes.map((tx) => tx.rate_note).filter(Boolean))] as string[]

  return (
    <>
      <div className="divide-y">
        {taxes.map((tx, i) => (
          <div key={i} className="flex items-center px-3 sm:px-5 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{tx.label_ar}</div>
              <div className="text-xs text-muted-foreground truncate">{tx.label_en}</div>
            </div>
            <div className="w-16 sm:w-28 text-center shrink-0">
              <span title={tx.rate_note ?? undefined}>
                <Badge variant="outline" className="font-mono text-xs" dir="ltr">
                  {tx.rate ?? "—"}
                  {tx.rate_note && <span className="text-muted-foreground ms-0.5">*</span>}
                </Badge>
              </span>
            </div>
            <div className="w-20 sm:w-36 text-start font-mono text-xs sm:text-sm tabular-nums shrink-0 hidden sm:block" dir="ltr">
              {fmtEGP(amounts[i])}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center px-3 sm:px-5 py-3 bg-muted/40 border-t-2 border-primary/20">
        <div className="flex-1 text-sm font-bold">{t("detail.estimatedTotal")}</div>
        <div className="w-16 sm:w-28 shrink-0" />
        <div className="w-20 sm:w-36 text-start font-mono text-sm font-bold tabular-nums shrink-0 hidden sm:block" dir="ltr">
          {fmtEGP(total)}
        </div>
      </div>
      {notes.length > 0 && (
        <div className="px-3 sm:px-5 py-2 text-xs text-muted-foreground">
          {notes.map((note, i) => (
            <div key={i}>* {note}</div>
          ))}
        </div>
      )}
    </>
  )
}

function parseRate(rate: string | null): number | null {
  if (!rate) return null
  const match = rate.match(/([\d.]+)/)
  return match ? parseFloat(match[1]) : null
}

function computeBill(taxes: Tax[], base: number): { amounts: number[]; total: number } {
  let dutyTotal = 0
  const amounts: number[] = []

  for (const tx of taxes) {
    const pct = parseRate(tx.rate)
    if (pct === null) { amounts.push(0); continue }

    if (tx.rate_note) {
      const amount = Math.round((base + dutyTotal) * pct / 100)
      amounts.push(amount)
    } else {
      const amount = Math.round(base * pct / 100)
      amounts.push(amount)
      if (tx.label_en.includes("Import Duty") || tx.label_en.includes("Table Tax")) {
        dutyTotal += amount
      }
    }
  }

  const total = amounts.reduce((s, a) => s + a, 0)
  return { amounts, total }
}

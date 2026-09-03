"use client"

import * as React from "react"
import { ExternalLink } from "lucide-react"

import type { CatalystMeta, CatalystType, FdaRow } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Delta, Meter, RelativeDays, Stat, StatGrid } from "@/components/desk"
import { SortHead, useSort } from "@/components/desk/sortable"

type Catalog = Partial<Record<CatalystType, CatalystMeta>>

type Filter =
  | "all"
  | "fresh"
  | "pdufa"
  | "adcom"
  | "trial_readout"
  | "breakthrough"
  | "fast_track"
  | "high"
  | "small"

type SortKey =
  | "fcs"
  | "ticker"
  | "days_since"
  | "price"
  | "change_pct"
  | "first_alert_price"
  | "change_since_alert_pct"
  | "market_cap"
  | "short_float"
  | "short_ratio"
  | "fcs_label"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fresh", label: "Fresh ≤3d" },
  { value: "pdufa", label: "PDUFA" },
  { value: "adcom", label: "AdCom" },
  { value: "trial_readout", label: "Trial readout" },
  { value: "breakthrough", label: "Breakthrough" },
  { value: "fast_track", label: "Fast track" },
  { value: "high", label: "High conviction" },
  { value: "small", label: "Small cap" },
]

const MATCH: Record<Filter, (r: FdaRow) => boolean> = {
  all: () => true,
  fresh: (r) => r.days_since <= 3,
  pdufa: (r) => r.catalyst_types.includes("pdufa"),
  adcom: (r) => r.catalyst_types.includes("adcom"),
  trial_readout: (r) => r.catalyst_types.includes("trial_readout"),
  breakthrough: (r) => r.catalyst_types.includes("breakthrough"),
  fast_track: (r) => r.catalyst_types.includes("fast_track"),
  high: (r) => r.fcs >= 70,
  small: (r) => r.market_cap > 0 && r.market_cap < 2e9,
}

const read = (r: FdaRow, k: SortKey) => r[k] as number | string | null

/**
 * FCS is a magnitude, so its colour is a ramp: faint → info → warn → down,
 * always beside the number and the conviction word.
 */
function fcsTone(fcs: number) {
  if (fcs >= 80) return { text: "text-down", meter: "down" } as const
  if (fcs >= 60) return { text: "text-info", meter: "info" } as const
  if (fcs >= 40) return { text: "text-warn", meter: "warn" } as const
  return { text: "text-faint", meter: "muted" } as const
}

function convictionTone(label: string) {
  if (label.includes("HIGH")) return "text-down"
  if (label.includes("STRONG")) return "text-info"
  if (label.includes("WATCH")) return "text-warn"
  return "text-faint"
}

/** Days-since is a freshness ramp; ≤3d is the pre-move window. */
function ageTone(days: number) {
  if (days <= 3) return "text-up"
  if (days <= 7) return "text-warn"
  return "text-faint"
}

function daysLabel(days: number) {
  return days === 0 ? "Today" : days === 1 ? "1d ago" : `${days}d ago`
}

export function FdaTable({
  rows,
  catalog,
}: {
  rows: FdaRow[]
  catalog: Catalog
}) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const filtered = React.useMemo(
    () => rows.filter(MATCH[filter]),
    [rows, filter]
  )
  const { sort, toggle, sorted } = useSort<FdaRow, SortKey>(
    filtered,
    { key: "fcs", dir: -1 },
    read
  )

  const top = [...rows].sort((a, b) => b.fcs - a.fcs)[0]
  const count = (f: Filter) => rows.filter(MATCH[f]).length

  // Impact ranking falls out of the server's own scores; nothing is ordered here.
  const dictionary = React.useMemo(
    () =>
      (Object.entries(catalog) as [CatalystType, CatalystMeta][]).sort(
        (a, b) => (b[1].score ?? 0) - (a[1].score ?? 0)
      ),
    [catalog]
  )

  return (
    <>
      <Card className="gap-0 px-4 py-4">
        <StatGrid columns={6}>
          <Stat label="Total candidates" value={rows.length} />
          <Stat label="PDUFA" value={count("pdufa")} tone="down" />
          <Stat
            label="Breakthrough"
            value={count("breakthrough")}
            tone="info"
          />
          <Stat label="Fast track" value={count("fast_track")} tone="info" />
          <Stat label="Fresh ≤3d" value={count("fresh")} tone="up" />
          <Stat label="High conviction" value={count("high")} tone="warn" />
          <Stat
            label="Top pick"
            value={top ? `${top.ticker} ${top.fcs}` : "—"}
            tone={top && top.fcs >= 80 ? "down" : "info"}
          />
        </StatGrid>
      </Card>

      <Card className="gap-0 py-0">
        <Collapsible>
          <CollapsibleTrigger className="w-full px-4 py-3 text-left text-[11px] transition-colors hover:bg-accent/40">
            <span className="text-muted-foreground">
              Catalyst dictionary — what each tag means, ranked by impact
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
              {dictionary.map(([key, m]) => (
                <div key={key} className="border-t border-line-soft pt-2">
                  <div className="flex items-baseline gap-2 font-medium">
                    <span>{m.emoji}</span>
                    <span className="text-[12px]">{m.label}</span>
                    <span className="tabular ml-auto text-[11px] text-faint">
                      {m.score}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {m.full_name}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-faint">
                    {m.trade_note || m.desc}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as Filter)}
          variant="outline"
          size="sm"
          className="flex-wrap"
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem
              key={f.value}
              value={f.value}
              className="px-3 text-[11px]"
            >
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="text-[11px] text-faint">
          {sorted.length} of {rows.length} shown
        </span>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table className="text-[12px]">
            <TableHeader>
              <TableRow>
                <SortHead sortKey="fcs" sort={sort} onSort={toggle}>
                  FCS
                </SortHead>
                <SortHead sortKey="ticker" sort={sort} onSort={toggle}>
                  Ticker
                </SortHead>
                <TableHead>Catalyst type</TableHead>
                <SortHead sortKey="days_since" sort={sort} onSort={toggle}>
                  Filed
                </SortHead>
                <SortHead
                  sortKey="price"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Price
                </SortHead>
                <SortHead
                  sortKey="change_pct"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Chg %
                </SortHead>
                <SortHead
                  sortKey="first_alert_price"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Alert px
                </SortHead>
                <SortHead
                  sortKey="change_since_alert_pct"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Since alert
                </SortHead>
                <SortHead
                  sortKey="market_cap"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Mkt cap
                </SortHead>
                <SortHead
                  sortKey="short_float"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Short %
                </SortHead>
                <SortHead
                  sortKey="short_ratio"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  DTC
                </SortHead>
                <TableHead>Trade stage</TableHead>
                <SortHead sortKey="fcs_label" sort={sort} onSort={toggle}>
                  Conviction
                </SortHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => {
                const tone = fcsTone(r.fcs)
                return (
                  <TableRow key={r.ticker}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Meter
                          value={r.fcs}
                          tone={tone.meter}
                          className="w-12 shrink-0"
                        />
                        <span className={cn("tabular font-medium", tone.text)}>
                          {r.fcs}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-44">
                      <div className="flex items-center gap-1.5">
                        {r.filing_url ? (
                          <a
                            href={r.filing_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold hover:text-info"
                          >
                            {r.ticker}
                            <ExternalLink className="size-3 opacity-50" />
                          </a>
                        ) : (
                          <span className="font-semibold">{r.ticker}</span>
                        )}
                        {r.days_since <= 3 ? (
                          <Badge variant="ok" className="px-1.5 text-[9px]">
                            NEW
                          </Badge>
                        ) : null}
                      </div>
                      <div className="truncate text-[10px] text-faint">
                        {r.company}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.catalyst_types.map((t) => {
                          const m = catalog[t]
                          return (
                            <Tooltip key={t}>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="cursor-help px-1.5 text-[9px] whitespace-nowrap"
                                >
                                  {m?.emoji} {m?.label ?? t}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-64">
                                <p className="font-medium">
                                  {m?.full_name ?? t}
                                </p>
                                <p className="mt-1 text-muted-foreground">
                                  {m?.trade_note ?? ""}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn("whitespace-nowrap", ageTone(r.days_since))}
                    >
                      {daysLabel(r.days_since)}
                      <span className="block text-[10px] text-faint">
                        {r.file_date}
                      </span>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {r.price > 0 ? `$${r.price.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.price > 0 ? (
                        <Delta value={r.change_pct} digits={2} suffix="%" />
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {r.first_alert_price != null &&
                      r.first_alert_price > 0 ? (
                        <>
                          ${r.first_alert_price.toFixed(2)}
                          <span className="block text-[10px] text-faint">
                            <RelativeDays ts={r.first_alert_ts} />
                          </span>
                        </>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* null means no baseline; 0 means genuinely flat */}
                      {r.change_since_alert_pct != null ? (
                        <Delta
                          value={r.change_since_alert_pct}
                          digits={2}
                          suffix="%"
                        />
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {r.mktcap_str || "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right",
                        r.short_float >= 25
                          ? "font-medium text-down"
                          : r.short_float >= 15
                            ? "text-warn"
                            : "text-faint"
                      )}
                    >
                      {r.short_float > 0 ? `${r.short_float.toFixed(1)}%` : "—"}
                    </TableCell>
                    <TableCell className="tabular text-right text-faint">
                      {r.short_ratio > 0 ? `${r.short_ratio.toFixed(1)}d` : "—"}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {r.trade_stage || "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium whitespace-nowrap",
                        convictionTone(r.fcs_label)
                      )}
                    >
                      {r.fcs_label}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {sorted.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyDescription>No filings match this filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </Card>
    </>
  )
}

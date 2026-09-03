"use client"

import * as React from "react"

import {
  EXIT_TONE,
  rrTone,
  SPI_BAND,
  spiBand,
  squeezeSummary,
  ZONE,
} from "@/lib/squeeze"
import type { SqueezeRow } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
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
import { Delta, Meter, Stat, StatGrid } from "@/components/desk"
import { SortHead, useSort } from "@/components/desk/sortable"

type Filter = "all" | "zone1" | "zone2" | "active" | "building" | "watch"
type SortKey =
  | "entry_rank"
  | "ticker"
  | "entry_zone"
  | "entry"
  | "stop"
  | "target"
  | "rr"
  | "spi"
  | "price"
  | "change_pct"
  | "short_float"
  | "dtc"
  | "vol_ratio"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "zone1", label: "Zone 1" },
  { value: "zone2", label: "Zone 2" },
  { value: "active", label: "Active" },
  { value: "building", label: "Building" },
  { value: "watch", label: "Watch" },
]

const MATCH: Record<Filter, (r: SqueezeRow) => boolean> = {
  all: () => true,
  active: (r) => r.spi >= 75,
  building: (r) => r.spi >= 50 && r.spi < 75,
  watch: (r) => r.spi >= 30 && r.spi < 50,
  zone1: (r) => r.entry_zone === 1,
  zone2: (r) => r.entry_zone === 2,
}

const read = (r: SqueezeRow, k: SortKey) => r[k] as number | string | null

function money(v: number | null | undefined) {
  return v == null ? "—" : `$${v.toFixed(2)}`
}

export function SqueezeTable({ rows }: { rows: SqueezeRow[] }) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const summary = React.useMemo(() => squeezeSummary(rows), [rows])

  const filtered = React.useMemo(
    () => rows.filter(MATCH[filter]),
    [rows, filter]
  )
  const { sort, toggle, sorted } = useSort<SqueezeRow, SortKey>(
    filtered,
    { key: "spi", dir: -1 },
    read
  )

  return (
    <>
      <Card className="gap-0 px-4 py-4">
        <StatGrid columns={6}>
          <Stat label="Total candidates" value={summary.total} />
          <Stat label="Active squeezes" value={summary.active} tone="down" />
          <Stat label="Building" value={summary.building} tone="warn" />
          <Stat label="On watch" value={summary.watch} tone="info" />
          <Stat label="#1 entry" value={summary.topEntry ?? "—"} tone="up" />
          <Stat label="Best R/R" value={summary.bestRr ?? "—"} tone="up" />
          <Stat label="Zone 1 setups" value={summary.zone1} />
          <Stat
            label="Top SPI"
            value={summary.topSpi ?? "—"}
            tone={
              summary.topSpi == null
                ? "muted"
                : summary.topSpi >= 75
                  ? "down"
                  : summary.topSpi >= 50
                    ? "warn"
                    : "info"
            }
          />
        </StatGrid>
      </Card>

      {/* Z2 pullback alerts — the one thing on this page that is time-critical,
          so it sits above the table rather than inside a column. */}
      <Card className="gap-0 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-[10px] tracking-[0.14em] text-faint uppercase">
            Z2 pullbacks
          </span>
          {summary.pullbackActive.length || summary.pullbackNear.length ? (
            <>
              {summary.pullbackActive.map((r) => (
                <Badge
                  key={r.ticker}
                  variant="ok"
                  className="font-mono text-[11px]"
                >
                  {r.ticker} ENTRY NOW · +
                  {(r.pct_from_breakout ?? 0).toFixed(1)}% above{" "}
                  {money(r.breakout_level)}
                </Badge>
              ))}
              {summary.pullbackNear.map((r) => (
                <Badge
                  key={r.ticker}
                  variant="outline"
                  className="border-info/40 font-mono text-[11px] text-info"
                >
                  {r.ticker} pulling back · +
                  {(r.pct_from_breakout ?? 0).toFixed(1)}%
                </Badge>
              ))}
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {summary.zone2} Zone 2 names tracked — no active pullbacks right
              now.
            </span>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as Filter)}
          variant="outline"
          size="sm"
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
          {sorted.length} of {rows.length} shown · ranked by entry score
        </span>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table className="text-[12px]">
            <TableHeader>
              <TableRow>
                <SortHead sortKey="entry_rank" sort={sort} onSort={toggle}>
                  Rank
                </SortHead>
                <SortHead sortKey="ticker" sort={sort} onSort={toggle}>
                  Ticker
                </SortHead>
                <SortHead sortKey="entry_zone" sort={sort} onSort={toggle}>
                  Zone
                </SortHead>
                <SortHead
                  sortKey="entry"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Entry
                </SortHead>
                <SortHead
                  sortKey="stop"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Stop
                </SortHead>
                <SortHead
                  sortKey="target"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Target
                </SortHead>
                <SortHead
                  sortKey="rr"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  R/R
                </SortHead>
                <TableHead>Exit signal</TableHead>
                <TableHead>Z2 pullback</TableHead>
                <SortHead sortKey="spi" sort={sort} onSort={toggle}>
                  SPI
                </SortHead>
                <TableHead>Status</TableHead>
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
                  sortKey="short_float"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Short %
                </SortHead>
                <SortHead
                  sortKey="dtc"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  DTC
                </SortHead>
                <SortHead
                  sortKey="vol_ratio"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                >
                  Vol
                </SortHead>
                <TableHead className="text-right">Mkt cap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r, i) => {
                const band = SPI_BAND[spiBand(r.spi)]
                const zone = r.entry_zone ? ZONE[r.entry_zone] : null
                const exit = r.exit_top
                return (
                  <TableRow key={r.ticker}>
                    <TableCell
                      className={cn(
                        "tabular font-medium",
                        i < 3
                          ? "text-warn"
                          : i < 10
                            ? "text-info"
                            : "text-faint"
                      )}
                    >
                      #{i + 1}
                    </TableCell>
                    <TableCell className="font-semibold">{r.ticker}</TableCell>
                    <TableCell>
                      {zone ? (
                        <span className={cn("font-medium", zone.text)}>
                          {zone.short}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium text-up">
                      {money(r.entry ?? r.price)}
                    </TableCell>
                    <TableCell className="tabular text-right text-down">
                      {money(r.stop)}
                    </TableCell>
                    <TableCell className="tabular text-right text-up">
                      {money(r.target)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right font-medium",
                        rrTone(r.rr)
                      )}
                    >
                      {(r.rr ?? 0).toFixed(1)}:1
                    </TableCell>
                    <TableCell>
                      {exit ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={cn(
                                "cursor-help",
                                EXIT_TONE[exit.severity] ?? "text-up"
                              )}
                            >
                              {exit.signal}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-56">
                            {exit.reason || "No detail given."}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-up">Holding</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      <PullbackCell row={r} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Meter
                          value={r.spi}
                          tone={band.meter}
                          className="w-14 shrink-0"
                        />
                        <span className={cn("tabular font-medium", band.text)}>
                          {r.spi}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn("text-[11px] font-medium", band.text)}
                      >
                        {band.label}
                      </span>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(r.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Delta value={r.change_pct} digits={1} suffix="%" />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right",
                        r.short_float >= 30
                          ? "font-medium text-down"
                          : r.short_float >= 20
                            ? "text-warn"
                            : undefined
                      )}
                    >
                      {r.short_float.toFixed(1)}%
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {(r.dtc ?? 0).toFixed(1)}d
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular text-right",
                        r.vol_ratio >= 5
                          ? "font-medium text-down"
                          : r.vol_ratio >= 2
                            ? "text-warn"
                            : undefined
                      )}
                    >
                      {(r.vol_ratio ?? 0).toFixed(1)}x
                    </TableCell>
                    <TableCell className="text-right text-faint">
                      {r.mktcap || "—"}
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
              <EmptyDescription>No names match this filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </Card>
    </>
  )
}

function PullbackCell({ row }: { row: SqueezeRow }) {
  if (row.entry_zone !== 2) return <span className="text-faint">—</span>

  const pct = row.pct_from_breakout ?? 0
  const level = row.breakout_level ?? 0

  if (row.pullback_active) {
    return (
      <span className="font-medium text-up">
        ENTRY NOW
        <br />
        <span className="font-normal text-faint">
          +{pct.toFixed(1)}% above {money(level)}
        </span>
      </span>
    )
  }
  if (row.pullback_near) {
    return (
      <span className="text-info">
        Pulling back
        <br />
        <span className="text-faint">
          +{pct.toFixed(1)}% above {money(level)}
        </span>
      </span>
    )
  }
  if (level > 0) {
    return (
      <span className="text-faint">
        +{pct.toFixed(1)}% above
        <br />
        BK {money(level)}
      </span>
    )
  }
  return <span className="text-faint">—</span>
}

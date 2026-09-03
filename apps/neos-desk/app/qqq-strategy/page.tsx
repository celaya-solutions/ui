import type { Metadata } from "next"
import fixture from "@/data/qqq-strategy.json"

import { deskGet, endpoint } from "@/lib/api"
import type { CamarillaPivots, QqqStrategyState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Delta,
  DeskPage,
  DeskPageHeader,
  DeskSection,
  Stat,
  StatGrid,
} from "@/components/desk"
import type { PriceBand, PriceLevel } from "@/components/desk/candle-chart"
import { CandleChart } from "@/components/desk/candle-chart"
import { SourceBadge } from "@/components/desk/source-badge"

export const metadata: Metadata = { title: "QQQ Strategy" }

const qqqStrategy = endpoint(
  "/qqq_strategy/api/data",
  fixture as unknown as QqqStrategyState
)

/** Pivot order top to bottom — the ladder is the point. */
const PIVOT_ORDER: (keyof CamarillaPivots)[] = [
  "H4",
  "H3",
  "H2",
  "H1",
  "L1",
  "L2",
  "L3",
  "L4",
]

const DAY_VARIANT = {
  BREAKOUT: "bad",
  TREND_POSSIBLE: "stale",
  REVERSION: "ok",
} as const

function num(v: number | null | undefined, digits = 2) {
  return v == null ? "—" : v.toFixed(digits)
}

export default async function QqqStrategyPage() {
  const { data, live, reason } = await deskGet(qqqStrategy)
  const p = data.pivots

  // H3/H4 and L3/L4 are the walls the day type is defined against, so they are
  // drawn heavier than the inner pivots.
  const levels: PriceLevel[] = PIVOT_ORDER.map((key) => ({
    price: p[key],
    label: `${key} ${p[key].toFixed(2)}`,
    tone: key.startsWith("H") ? ("down" as const) : ("up" as const),
    dashed: key === "H1" || key === "H2" || key === "L1" || key === "L2",
  }))
  const bands: PriceBand[] = data.fvgs.map((f) => ({
    top: f.top,
    bottom: f.bottom,
    tone: (f.type === "bullish" ? "up" : "down") as PriceBand["tone"],
    label: `FVG ${f.time}`,
  }))

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            {data.symbol} · Camarilla, FVG &amp; Brooks
            <Badge variant={DAY_VARIANT[data.day_type.type] ?? "secondary"}>
              {data.day_type.label}
            </Badge>
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description={data.day_type.desc}
        meta={
          <span className="flex flex-col items-end gap-0.5">
            <span className="tabular text-[13px] text-foreground">
              {num(data.price)}
            </span>
            <span>
              <Delta value={data.change_pct} digits={2} suffix="%" /> · O{" "}
              {num(data.open)} H {num(data.high)} L {num(data.low)}
            </span>
            <span>updated {data.updated}</span>
          </span>
        }
      />

      <Card className="gap-0 py-4">
        <CardContent className="px-4">
          <CandleChart
            candles={data.candles}
            bands={bands}
            levels={[
              ...levels,
              {
                price: data.price,
                label: `last ${data.price.toFixed(2)}`,
                tone: "muted",
                dashed: true,
              },
            ]}
            height={380}
          />
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3 [&>*]:min-w-0">
        <DeskSection label="Camarilla pivots" aside="from yesterday's range">
          <Card className="gap-0 overflow-hidden py-0">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">vs last</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PIVOT_ORDER.map((key) => {
                  const gap = p[key] - data.price
                  const wall =
                    key === "H3" || key === "H4" || key === "L3" || key === "L4"
                  return (
                    <TableRow key={key}>
                      <TableCell
                        className={cn(
                          wall ? "font-semibold" : "text-muted-foreground",
                          key.startsWith("H") ? "text-down" : "text-up"
                        )}
                      >
                        {key}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {num(p[key])}
                      </TableCell>
                      <TableCell className="tabular text-right text-faint">
                        {gap >= 0 ? "+" : ""}
                        {gap.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </DeskSection>

        <DeskSection
          label="Liquidity pools"
          aside="unswept levels are the magnets"
        >
          <Card className="gap-0 overflow-hidden py-0">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...data.pools]
                  .sort((a, b) => b.level - a.level)
                  .map((pool, i) => (
                    <TableRow key={`${pool.label}-${i}`}>
                      <TableCell>
                        <span
                          className={cn(
                            "font-medium",
                            pool.type === "BSL" ? "text-down" : "text-up"
                          )}
                        >
                          {pool.type}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {pool.label}
                        </span>
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {num(pool.level)}
                      </TableCell>
                      <TableCell>
                        <span className="tracking-[0.2em] text-faint">
                          {"●".repeat(pool.strength)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={pool.swept ? "secondary" : "info"}
                          className="px-1.5 text-[9px]"
                        >
                          {pool.swept ? "swept" : "resting"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </DeskSection>

        <DeskSection label="Fair value gaps" aside="unfilled imbalance">
          <Card className="gap-0 overflow-hidden py-0">
            {data.fvgs.length ? (
              <Table className="text-[12px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kind</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Mid</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fvgs.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell
                        className={cn(
                          "font-medium",
                          f.type === "bullish" ? "text-up" : "text-down"
                        )}
                      >
                        {f.type}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {f.time}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {num(f.mid)}
                      </TableCell>
                      <TableCell className="tabular text-right text-faint">
                        {num(Math.abs(f.size))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyDescription>No unfilled gaps today.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </DeskSection>
      </div>

      <DeskSection label="Signals" aside="highest priority first">
        <div className="grid gap-3 md:grid-cols-2 [&>*]:min-w-0">
          {data.signals
            .slice()
            .sort((a, b) => b.priority - a.priority)
            .map((s, i) => (
              <Card key={i} className="gap-0 py-4">
                <CardContent className="px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={s.type === "ENTRY" ? "ok" : "stale"}>
                      {s.type}
                    </Badge>
                    <Badge variant={s.direction === "LONG" ? "ok" : "bad"}>
                      {s.direction}
                    </Badge>
                    <span className="font-sans text-[13px] font-semibold">
                      {s.signal}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                    {s.reason}
                  </p>
                  <StatGrid columns={3} className="mt-3">
                    <Stat label="Entry" value={num(s.entry)} />
                    <Stat label="Stop" value={num(s.stop)} tone="down" />
                    <Stat label="Target" value={num(s.target)} tone="up" />
                  </StatGrid>
                </CardContent>
              </Card>
            ))}
        </div>
      </DeskSection>

      <DeskSection label="Al Brooks second entries" aside="most recent first">
        <Card className="gap-0 overflow-hidden py-0">
          {data.setups.length ? (
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Stop</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Risk</TableHead>
                  <TableHead className="text-right">R/R</TableHead>
                  <TableHead className="text-right">Confluence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.setups.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">
                      {s.time}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.direction === "LONG" ? "ok" : "bad"}>
                        {s.direction}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium",
                        s.strength === "HIGH" ? "text-up" : "text-warn"
                      )}
                    >
                      {s.strength}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {num(s.entry)}
                    </TableCell>
                    <TableCell className="tabular text-right text-down">
                      {num(s.stop)}
                    </TableCell>
                    <TableCell className="tabular text-right text-up">
                      {num(s.target)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {num(s.risk)}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {s.rr.toFixed(1)}:1
                    </TableCell>
                    <TableCell className="tabular text-right text-faint">
                      {s.confluence}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyDescription>
                  No second entries printed yet today.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </Card>
      </DeskSection>
    </DeskPage>
  )
}

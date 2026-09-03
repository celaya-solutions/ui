import type { Metadata } from "next"
import fixture from "@/data/bank-rule-tunnel.json"

import { deskGet, endpoint } from "@/lib/api"
import type { BankRuleTunnelState } from "@/lib/types"
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
  compact,
  DeskPage,
  DeskPageHeader,
  DeskSection,
  LiveDot,
  RelativeTime,
  Stat,
  StatGrid,
} from "@/components/desk"
import type { PriceBand, PriceLevel } from "@/components/desk/candle-chart"
import { CandleChart } from "@/components/desk/candle-chart"
import { SourceBadge } from "@/components/desk/source-badge"

export const metadata: Metadata = { title: "Bank Rule Tunnel" }

const bankRuleTunnel = endpoint(
  "/bank_rule_tunnel/api",
  fixture as unknown as BankRuleTunnelState
)

const BIAS: Record<string, { variant: "ok" | "bad" | "secondary" }> = {
  BULLISH: { variant: "ok" },
  BEARISH: { variant: "bad" },
  NEUTRAL: { variant: "secondary" },
}

function num(v: number | null | undefined, digits = 2) {
  return v == null ? "—" : v.toFixed(digits)
}

export default async function BankRuleTunnelPage() {
  const { data, live, reason } = await deskGet(bankRuleTunnel)
  const l = data.live ?? {}

  // Three kinds of overlay, three encodings: gaps and blocks are ranges, so
  // they are bands; the tunnel walls are single prices, so they are rules;
  // sweeps are events on one candle, so they are points.
  const bands: PriceBand[] = [
    ...data.fvgs.map((f) => ({
      top: f.top,
      bottom: f.bot,
      tone: (f.dir === "bull" ? "up" : "down") as PriceBand["tone"],
      label: `FVG ${f.time}`,
    })),
    ...data.obs.map((o) => ({
      top: o.top,
      bottom: o.bot,
      tone: (o.dir === "bull" ? "info" : "special") as PriceBand["tone"],
      label: `OB ${o.time}`,
    })),
  ]
  const levels: PriceLevel[] = [
    ...(data.tunnel.top != null
      ? [
          {
            price: data.tunnel.top,
            label: `tunnel top ${data.tunnel.top.toFixed(2)}`,
            tone: "warn" as const,
          },
        ]
      : []),
    ...(data.tunnel.bot != null
      ? [
          {
            price: data.tunnel.bot,
            label: `tunnel bot ${data.tunnel.bot.toFixed(2)}`,
            tone: "warn" as const,
          },
        ]
      : []),
    ...(l.price != null
      ? [
          {
            price: l.price,
            label: `last ${l.price.toFixed(2)}`,
            tone: "muted" as const,
            dashed: true,
          },
        ]
      : []),
  ]
  const markers = data.sweeps.map((s) => ({
    index: s.index,
    price: s.price,
    dir: s.dir,
    label: s.time,
  }))

  const width =
    data.tunnel.top != null && data.tunnel.bot != null
      ? data.tunnel.top - data.tunnel.bot
      : null

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            Bank Rule Tunnel · SPY 1m
            <Badge variant={BIAS[data.bias]?.variant ?? "secondary"}>
              {data.bias}
            </Badge>
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="ICT/SMC structure off the desk's own depth tape: liquidity swept either side, the fair-value gaps and order blocks left behind, and the tunnel between the nearest untaken highs and lows. Bias is the direction of the most recent sweep."
        meta={
          <span className="flex flex-col items-end gap-0.5">
            <span className="tabular text-[13px] text-foreground">
              {num(l.price)}
            </span>
            <span className="flex items-center gap-1.5">
              <LiveDot live={data.live.price != null} />
              {data.candles.length} candles · <RelativeTime ts={data.ts} />
            </span>
          </span>
        }
      />

      <Card className="gap-0 px-4 py-4">
        <StatGrid columns={6}>
          <Stat label="LT-Bid" value={compact(l.lt_bid)} tone="up" />
          <Stat label="LT-Ask" value={compact(l.lt_ask)} tone="down" />
          <Stat
            label="LT-Diff"
            value={compact(l.lt_diff)}
            tone={(l.lt_diff ?? 0) >= 0 ? "up" : "down"}
          />
          <Stat
            label="CVD"
            value={compact(l.cvd)}
            tone={(l.cvd ?? 0) >= 0 ? "up" : "down"}
          />
          <Stat label="Tunnel top" value={num(data.tunnel.top)} tone="warn" />
          <Stat
            label="Tunnel bottom"
            value={num(data.tunnel.bot)}
            tone="warn"
            hint={width != null ? `${width.toFixed(2)} wide` : undefined}
          />
        </StatGrid>
      </Card>

      <Card className="gap-0 py-4">
        <CardContent className="px-4">
          <CandleChart
            candles={data.candles}
            bands={bands}
            levels={levels}
            markers={markers}
            height={360}
          />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-faint">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[1px] bg-up/25" />
              bullish FVG
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[1px] bg-down/25" />
              bearish FVG
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[1px] bg-info/25" />
              bullish order block
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[1px] bg-special/25" />
              bearish order block
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-px w-3.5 bg-warn" />
              tunnel wall
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-up" />
              liquidity sweep
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <DeskSection label="Sweeps" aside="most recent first">
          <Card className="gap-0 overflow-hidden py-0">
            {data.sweeps.length ? (
              <Table className="text-[12px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-right">Level swept</TableHead>
                    <TableHead className="text-right">vs last</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...data.sweeps].reverse().map((s, i) => (
                    <TableRow key={`${s.index}-${i}`}>
                      <TableCell className="text-muted-foreground">
                        {s.time}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          s.dir === "up" ? "text-up" : "text-down"
                        )}
                      >
                        {s.dir === "up" ? "swept lows" : "swept highs"}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {num(s.price)}
                      </TableCell>
                      <TableCell className="tabular text-right text-faint">
                        {l.price != null
                          ? `${s.price - l.price >= 0 ? "+" : ""}${(
                              s.price - l.price
                            ).toFixed(2)}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyDescription>No sweeps in this window.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </DeskSection>

        <DeskSection label="Gaps &amp; order blocks">
          <Card className="gap-0 overflow-hidden py-0">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Bottom</TableHead>
                  <TableHead className="text-right">Top</TableHead>
                  <TableHead className="text-right">Width</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ...data.fvgs.map((f) => ({ ...f, kind: "FVG" as const })),
                  ...data.obs.map((o) => ({
                    ...o,
                    kind: "Order block" as const,
                  })),
                ]
                  .sort((a, b) => b.index - a.index)
                  .map((r, i) => (
                    <TableRow key={`${r.kind}-${r.index}-${i}`}>
                      <TableCell
                        className={cn(
                          "font-medium",
                          r.dir === "bull" ? "text-up" : "text-down"
                        )}
                      >
                        {r.dir === "bull" ? "Bullish" : "Bearish"} {r.kind}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.time}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {num(Math.min(r.top, r.bot))}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {num(Math.max(r.top, r.bot))}
                      </TableCell>
                      <TableCell className="tabular text-right text-faint">
                        {num(Math.abs(r.top - r.bot))}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </DeskSection>
      </div>
    </DeskPage>
  )
}

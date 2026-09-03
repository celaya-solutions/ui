import type { Metadata } from "next"
import fixture from "@/data/spy-liquidity-flow.json"

import { deskGet, endpoint } from "@/lib/api"
import type { LiquidityFlowState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
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
  Meter,
  RelativeTime,
  Stat,
  StatGrid,
} from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { ProfileChart } from "@/app/spy-liquidity-flow/profile-chart"

export const metadata: Metadata = { title: "SPY Liquidity & Flow" }

const liquidityFlow = endpoint(
  "/spy_liquidity_flow/api/state",
  fixture as LiquidityFlowState
)

const ARROW = { up: "↑", down: "↓", flat: "→" } as const

function num(v: number | null | undefined, digits = 2) {
  return v == null ? "—" : v.toFixed(digits)
}

export default async function SpyLiquidityFlowPage() {
  const { data, live, reason } = await deskGet(liquidityFlow)

  if (data.error) {
    return (
      <DeskPage>
        <DeskPageHeader title="SPY Liquidity & Flow" />
        <Alert variant="destructive">
          <AlertTitle>Nothing to show</AlertTitle>
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
      </DeskPage>
    )
  }

  const arrow = data.volume_arrow
  const blocks = [
    ...data.order_blocks.bullish.map((b) => ({
      ...b,
      dir: "bullish" as const,
    })),
    ...data.order_blocks.bearish.map((b) => ({
      ...b,
      dir: "bearish" as const,
    })),
  ].sort((a, b) => b.high - a.high)

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            {data.symbol} · Liquidity &amp; Flow
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="Where volume has already changed hands, and which way it is leaning now. Pools are 5-minute bars bucketed by price; order blocks are the candle before a move larger than 1.5 ATR; the target is the nearest untapped pool in the flow direction."
        meta={
          <span className="flex flex-col items-end gap-0.5">
            <span className="tabular text-[13px] text-foreground">
              {num(data.price)}
            </span>
            <span>
              bid {num(data.bid)} / ask {num(data.ask)}
            </span>
            <span>
              {data.candle_count} candles · updated{" "}
              <RelativeTime ts={data.ts} />
            </span>
          </span>
        }
      />

      <div className="grid gap-3 lg:grid-cols-4 [&>*]:min-w-0">
        <Card className="gap-0 py-4">
          <CardContent className="px-4">
            <StatGrid columns={2} className="sm:grid-cols-2 [&>*]:min-w-0">
              <Stat
                label="Net flow"
                value={
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-xl">{ARROW[arrow.direction]}</span>
                    {arrow.direction}
                  </span>
                }
                tone={
                  arrow.direction === "up"
                    ? "up"
                    : arrow.direction === "down"
                      ? "down"
                      : "muted"
                }
              />
              <Stat
                label="Imbalance"
                value={`${(arrow.magnitude * 100).toFixed(1)}%`}
                hint="of traded volume"
              />
              <Stat
                label="Up volume"
                value={compact(arrow.up_volume)}
                tone="up"
              />
              <Stat
                label="Down volume"
                value={compact(arrow.down_volume)}
                tone="down"
              />
            </StatGrid>
            <Meter
              value={arrow.magnitude * 100}
              tone={
                arrow.direction === "up"
                  ? "up"
                  : arrow.direction === "down"
                    ? "down"
                    : "muted"
              }
              className="mt-3"
            />
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              Target{" "}
              <span className="font-medium text-warn">
                {data.price_target ? num(data.price_target.price) : "—"}
              </span>
              {data.price_target
                ? ` · ${compact(data.price_target.volume)} resting, untapped in the flow direction`
                : " · no untapped pool on that side"}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-0 py-4 lg:col-span-3">
          <CardContent className="px-4">
            <ProfileChart state={data} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <DeskSection
          label="Order blocks"
          aside="the candle before a >1.5 ATR move"
        >
          <Card className="gap-0 overflow-hidden py-0">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Low</TableHead>
                  <TableHead className="text-right">High</TableHead>
                  <TableHead className="text-right">Width</TableHead>
                  <TableHead className="text-right">vs last</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.map((b, i) => (
                  <TableRow key={`${b.dir}-${i}`}>
                    <TableCell
                      className={cn(
                        "font-medium",
                        b.dir === "bullish" ? "text-up" : "text-down"
                      )}
                    >
                      {b.dir}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {num(b.low)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {num(b.high)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {num(b.high - b.low)}
                    </TableCell>
                    <TableCell className="tabular text-right text-faint">
                      {data.price != null
                        ? `${(b.high + b.low) / 2 - data.price >= 0 ? "+" : ""}${(
                            (b.high + b.low) / 2 -
                            data.price
                          ).toFixed(2)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </DeskSection>

        <DeskSection label="Heaviest pools" aside="by traded volume">
          <Card className="gap-0 overflow-hidden py-0">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead>Share of heaviest</TableHead>
                  <TableHead className="text-right">vs last</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...data.pools]
                  .sort((a, b) => b.volume - a.volume)
                  .slice(0, 8)
                  .map((p) => (
                    <TableRow key={p.price}>
                      <TableCell className="tabular text-right font-medium">
                        {num(p.price)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {compact(p.volume)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Meter
                            value={p.thickness * 100}
                            tone="info"
                            className="w-16 shrink-0"
                          />
                          <span className="tabular text-faint">
                            {(p.thickness * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular text-right text-faint">
                        {data.price != null
                          ? `${p.price - data.price >= 0 ? "+" : ""}${(
                              p.price - data.price
                            ).toFixed(2)}`
                          : "—"}
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

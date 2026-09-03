import type { Metadata } from "next"
import fixture from "@/data/quant-flow.json"

import { deskGet, endpoint } from "@/lib/api"
import { isLayerError, type QuantFlowState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  ago,
  compact,
  DeskPage,
  DeskPageHeader,
  DeskSection,
  LiveDot,
  Stat,
  StatGrid,
} from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { TiltArrow, tiltColor } from "@/components/desk/tilt"
import { GexChart } from "@/app/quant-flow/gex-chart"

export const metadata: Metadata = { title: "Quant Flow" }

const quantFlow = endpoint(
  "/quant_flow/api/state",
  fixture as unknown as QuantFlowState
)

const GRADE_VARIANT: Record<string, "ok" | "info" | "stale" | "outline"> = {
  A: "ok",
  B: "info",
  C: "stale",
}

function money(v: number | null | undefined, digits = 2) {
  return v == null ? "—" : v.toFixed(digits)
}

function LayerFailed({ error }: { error: string }) {
  return (
    <Card className="gap-0 py-0">
      <Empty className="py-8">
        <EmptyHeader>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Card>
  )
}

export default async function QuantFlowPage() {
  const { data, live, reason } = await deskGet(quantFlow)
  const l1 = data.layers["1_price_l2"]
  const l2 = data.layers["2_options_flow"]
  const l3 = data.layers["3_gamma_exposure_by_strike"]
  const l4 = data.layers["4_dark_pool"]
  const darkLevels = l4.levels

  const bias = isLayerError(l2) ? null : l2.bias
  const ladderRows = Math.max(l1.ladder.bids.length, l1.ladder.asks.length)

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            {data.ticker} · Quant Flow
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="Four independent reads stacked into one pre-trade picture. Each layer carries its own error, so a dead endpoint dims one panel rather than the page."
        meta={
          <span className="flex flex-col items-end gap-0.5">
            <span className="tabular text-[13px] text-foreground">
              {money(l1.price)}
            </span>
            <span>
              bid {money(l1.bid)} · ask {money(l1.ask)}
            </span>
            <span className="flex items-center gap-1.5">
              <LiveDot live={l1.sources.ibkr.connected} />
              depth {ago(l1.sources.ibkr.last_write_age)} · quant{" "}
              {data.refresh_sec}s snapshot
            </span>
          </span>
        }
      />

      {/* Layers 2–4 are REST snapshots on a timer. Calling them live would be
          a lie, so the cadence is stated rather than implied by a green pip. */}
      <Alert>
        <AlertTitle>Read this the way the desk does</AlertTitle>
        <AlertDescription>
          <ul className="list-disc space-y-0.5 pl-4">
            {data.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <DeskSection label="Layer 1 · Desk depth" aside={l1.venueNotice}>
        <div className="grid gap-3 lg:grid-cols-3 [&>*]:min-w-0">
          <Card className="gap-0 py-4 lg:col-span-2">
            <CardContent className="px-4">
              {ladderRows ? (
                <Table className="text-[12px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">Bid size</TableHead>
                      <TableHead className="text-right">Bid</TableHead>
                      <TableHead className="text-right">Ask</TableHead>
                      <TableHead className="text-right">Ask size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: ladderRows }, (_, i) => {
                      const b = l1.ladder.bids[i]
                      const a = l1.ladder.asks[i]
                      return (
                        <TableRow key={i}>
                          <TableCell className="tabular text-right text-up">
                            {b ? b[1].toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            {b ? b[0].toFixed(2) : "—"}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            {a ? a[0].toFixed(2) : "—"}
                          </TableCell>
                          <TableCell className="tabular text-right text-down">
                            {a ? a[1].toLocaleString() : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyDescription>
                      Depth stream has published nothing yet.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardContent className="px-4">
              <StatGrid columns={2}>
                <Stat
                  label="IBKR depth"
                  value={l1.sources.ibkr.connected ? "connected" : "down"}
                  tone={l1.sources.ibkr.connected ? "up" : "down"}
                  hint={`last write ${ago(l1.sources.ibkr.last_write_age)}`}
                />
                {/* Context only — Schwab carries no ladder, so it can never be
                    the source of the depth above. */}
                <Stat
                  label="Schwab (context)"
                  value={l1.sources.schwab.connected ? "connected" : "off"}
                  tone={l1.sources.schwab.connected ? "up" : "muted"}
                  hint={l1.sources.schwab.detail ?? undefined}
                />
                <Stat label="Session" value={data.session} />
                <Stat
                  label="Quant cache"
                  value={`${data.cache.fresh ?? 0}/${data.cache.entries ?? 0}`}
                  hint={`${data.cache.ttl_sec ?? 0}s TTL`}
                />
              </StatGrid>
            </CardContent>
          </Card>
        </div>
      </DeskSection>

      <DeskSection label="Layer 2 · Options order flow">
        {isLayerError(l2) ? (
          <LayerFailed error={l2.error} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-4 [&>*]:min-w-0">
            <Card className="gap-0 py-4">
              <CardContent className="px-4">
                <TiltArrow
                  tilt={bias?.tilt ?? null}
                  arrow={
                    bias && bias.tilt != null
                      ? bias.tilt > 0
                        ? "↑"
                        : bias.tilt < 0
                          ? "↓"
                          : "→"
                      : "—"
                  }
                />
                <div
                  className="text-center text-[12px] font-medium"
                  style={{ color: tiltColor(bias?.tilt ?? null) }}
                >
                  {bias?.tilt == null ? "NO FLOW" : bias.label}
                </div>
                <div className="mt-1 text-center text-[11px] text-faint">
                  {bias?.tilt == null
                    ? "no directional premium in the window"
                    : `${bias.tilt > 0 ? "+" : ""}${(bias.tilt * 100).toFixed(
                        0
                      )}% tilt · ${
                        bias.callShare == null
                          ? "—"
                          : `${(bias.callShare * 100).toFixed(0)}% call`
                      }`}
                </div>
                {/* bullishShare is null when no directional premium exists at
                    all — that is "nothing to read", not a 50/50 split, so the
                    bar is hidden rather than drawn balanced. */}
                {l2.bullishShare != null ? (
                  <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-secondary">
                    <span
                      className="bg-up"
                      style={{
                        width: `${(l2.bullishShare * 100).toFixed(1)}%`,
                      }}
                    />
                    {/* a hairline of surface between the two fills */}
                    <span className="w-0.5 shrink-0 bg-card" />
                    <span className="flex-1 bg-down" />
                  </div>
                ) : null}
                <div className="mt-2 text-center text-[10px] leading-relaxed text-faint">
                  bull ${compact(l2.bullishPremium)} vs bear $
                  {compact(l2.bearishPremium)} · {bias?.sampleSize ?? 0} rows
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
              <div className="overflow-x-auto">
                <Table className="text-[12px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Exp</TableHead>
                      <TableHead className="text-right">Strike</TableHead>
                      <TableHead className="text-right">Premium</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="text-right">Vol/OI</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Bias</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {l2.data.map((r, i) => {
                      const dir =
                        r.direction === "BULLISH"
                          ? "text-up"
                          : r.direction === "BEARISH"
                            ? "text-down"
                            : "text-muted-foreground"
                      const flags = [
                        r.isGoldenSweep && "GOLDEN",
                        r.tradeConsolidationType === "SWEEP" && "SWEEP",
                        r.isUnusual && "UNUSUAL",
                        r.isOpeningPosition && "OPENING",
                        r.isVolumeGreaterThanOpenInterest && "V>OI",
                      ].filter(Boolean) as string[]
                      return (
                        <TableRow
                          key={`${r.strikePrice}-${r.expirationDate}-${i}`}
                        >
                          <TableCell>
                            <Badge
                              variant={GRADE_VARIANT[r.neosGrade] ?? "outline"}
                              className="px-1.5 text-[10px]"
                            >
                              {r.neosGrade || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn("font-medium", dir)}>
                            {r.contractType}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.expirationDate}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            {r.strikePrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            ${compact(r.premium)}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            {r.size.toLocaleString()}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            {compact(r.volume)}/{compact(r.openInterest)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.tradeSideCode}
                          </TableCell>
                          <TableCell className={dir}>{r.direction}</TableCell>
                          <TableCell className="text-[10px] text-faint">
                            {flags.join(" ") || "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </DeskSection>

      <DeskSection
        label="Layer 3 · Gamma exposure by strike"
        aside="positive pins, negative accelerates"
      >
        {isLayerError(l3) ? (
          <LayerFailed error={l3.error} />
        ) : (
          <Card className="gap-0 py-4">
            <CardContent className="px-4">
              <GexChart strikes={l3.topAbsolute} spot={l3.stockPrice} />
              {l3.stockPrice ? (
                <p className="mt-2 text-[11px] text-faint">
                  Spot {l3.stockPrice.toFixed(2)} (Quant Data) · nearest strike{" "}
                  {[...l3.topAbsolute]
                    .sort(
                      (a, b) =>
                        Math.abs(a.strike - l3.stockPrice!) -
                        Math.abs(b.strike - l3.stockPrice!)
                    )[0]
                    ?.strike.toFixed(2) ?? "—"}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}
      </DeskSection>

      <DeskSection label="Layer 4 · Dark pool levels">
        <div className="grid gap-3 lg:grid-cols-3 [&>*]:min-w-0">
          {isLayerError(darkLevels) ? (
            <div className="lg:col-span-2">
              <LayerFailed error={darkLevels.error} />
            </div>
          ) : (
            <Card className="gap-0 overflow-hidden py-0 lg:col-span-2">
              {darkLevels.topLevels.length ? (
                <Table className="text-[12px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Notional</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="text-right">vs last</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {darkLevels.topLevels.map((lvl) => {
                      const last = darkLevels.latestStockPrice
                      return (
                        <TableRow key={lvl.price}>
                          <TableCell className="tabular text-right font-medium">
                            {lvl.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            ${compact(lvl.notionalValue)}
                          </TableCell>
                          <TableCell className="tabular text-right">
                            {compact(lvl.size ?? lvl.volume)}
                          </TableCell>
                          <TableCell className="tabular text-right text-faint">
                            {last
                              ? `${lvl.price - last >= 0 ? "+" : ""}${(
                                  lvl.price - last
                                ).toFixed(2)}`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyDescription>
                      No dark-pool levels in the lookback window.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </Card>
          )}

          <Card className="gap-0 py-4">
            <CardContent className="px-4">
              <StatGrid columns={2}>
                <Stat
                  label="Last price"
                  value={
                    isLayerError(darkLevels)
                      ? "—"
                      : money(darkLevels.latestStockPrice)
                  }
                />
                <Stat
                  label="Intraday flow"
                  value={isLayerError(l4.intradayFlow) ? "failed" : "ok"}
                  tone={isLayerError(l4.intradayFlow) ? "down" : "up"}
                  hint={
                    isLayerError(l4.intradayFlow)
                      ? l4.intradayFlow.error
                      : undefined
                  }
                />
              </StatGrid>
            </CardContent>
          </Card>
        </div>
      </DeskSection>
    </DeskPage>
  )
}

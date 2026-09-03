import type { Metadata } from "next"
import fixture from "@/data/spx-dash.json"

import { deskGet, endpoint } from "@/lib/api"
import {
  bookSdVerdict,
  confidenceStars,
  headlineSignal,
  MAX_SCORE,
  signalRows,
  UNLOCK_AT,
} from "@/lib/spx"
import type { SpxDashState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import {
  ago,
  Delta,
  DeskPage,
  DeskPageHeader,
  DeskSection,
  LiveDot,
  Meter,
  Stat,
  StatGrid,
} from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { TiltBar, tiltColor } from "@/components/desk/tilt"
import { BookImbalanceChart, SpyPriceChart } from "@/app/spx-dash/charts"

export const metadata: Metadata = { title: "SPX Dash" }

const spxDash = endpoint(
  "/spx_dash/api/state",
  fixture as unknown as SpxDashState
)

const TONE_TEXT = {
  up: "text-up",
  down: "text-down",
  warn: "text-warn",
  muted: "text-muted-foreground",
} as const

function usd(v: number | null | undefined) {
  return v == null ? "—" : `$${v.toFixed(2)}`
}

export default async function SpxDashPage() {
  const { data, live, reason } = await deskGet(spxDash)
  const tick = data.tick
  const spx = data.spx

  if (!tick) {
    return (
      <DeskPage>
        <DeskPageHeader title="SPX Dash" />
        <Card className="gap-0 py-0">
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyDescription>
                No tick has scored yet. The engine drops frames with no usable
                price rather than publishing a 0.00.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      </DeskPage>
    )
  }

  const headline = headlineSignal(tick)
  const signals = signalRows(tick)
  const sd = bookSdVerdict(tick.book_sd)
  // The score is a polarity on a fixed ±7 scale, so it drives the same
  // diverging gauge the timeframe compass uses, normalised to ±1.
  const normalised = tick.total_score / MAX_SCORE

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            SPX Dash
            <Badge
              variant="outline"
              className={cn("font-medium", TONE_TEXT[headline.tone])}
            >
              {headline.label}
            </Badge>
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="Five signals off the Schwab SPY book — depth imbalance, cumulative delta, its momentum, the last completed one-minute candle, and the six-tick trend — summed to a single score, with ATR-sized levels when the score and the order block agree."
        meta={
          <span className="flex flex-col items-end gap-0.5">
            <span className="tabular text-[13px] text-foreground">
              SPY {tick.price.toFixed(2)}
            </span>
            <span className="tabular">
              SPX {spx.price == null ? "—" : spx.price.toFixed(2)}{" "}
              {spx.change_pct != null ? (
                <Delta value={spx.change_pct} digits={2} suffix="%" />
              ) : null}
            </span>
            <span className="flex items-center gap-1.5">
              <LiveDot live={!data.stale} />
              {data.stale ? "stale" : "live"} ·{" "}
              {ago(data.health.last_write_age)} · {data.session}
            </span>
          </span>
        }
      />

      {/* The session is knowable from the clock alone, so a page with no feed
          can still say why it is shut rather than sitting on an em-dash. */}
      {!data.tradeable ? (
        <Alert>
          <AlertTitle>Not tradeable right now</AlertTitle>
          <AlertDescription>
            {data.gate_reason ?? "The session gate is closed."}
          </AlertDescription>
        </Alert>
      ) : null}
      {data.stale ? (
        <Alert variant="destructive">
          <AlertTitle>The book feed is stale</AlertTitle>
          <AlertDescription>
            Last write {ago(data.health.last_write_age)} ago. Every score below
            describes an older book.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="gap-0 py-4 lg:col-span-2">
          <CardContent className="px-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] tracking-[0.14em] text-faint uppercase">
                5-signal score · max ±{MAX_SCORE}
              </span>
              <span
                className="tabular font-mono text-2xl"
                style={{ color: tiltColor(normalised) }}
              >
                {tick.total_score > 0 ? "+" : ""}
                {tick.total_score} / {MAX_SCORE}
              </span>
            </div>
            <TiltBar tilt={normalised} className="mt-3 h-1.5" />
            <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
              <span>Confidence {tick.confidence}%</span>
              <span>{confidenceStars(tick.confidence)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-4">
          <CardContent className="px-4">
            <div className="text-[10px] tracking-[0.14em] text-faint uppercase">
              Book SD · 30-tick window
            </div>
            <div
              className={cn(
                "tabular mt-1 font-mono text-2xl",
                tick.book_sd == null
                  ? "text-muted-foreground"
                  : TONE_TEXT[sd.tone]
              )}
            >
              {tick.book_sd == null ? "—" : `${tick.book_sd.toFixed(3)}%`}
            </div>
            <Meter
              value={
                tick.book_sd == null
                  ? 0
                  : Math.min((tick.book_sd / 0.5) * 100, 100)
              }
              tone={sd.tone === "muted" ? "info" : sd.tone}
              className="mt-2.5"
            />
            <p className="mt-2 text-[11px] text-faint">{sd.label}</p>
          </CardContent>
        </Card>
      </div>

      <DeskSection
        label="Signals"
        aside="each contributes its own range to the sum"
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5 [&>*]:min-w-0">
          {signals.map((s) => (
            <Card key={s.key} className="gap-0 py-4">
              <CardContent className="px-4">
                <div className="text-[10px] tracking-[0.12em] text-faint uppercase">
                  {s.name}
                </div>
                <div
                  className={cn(
                    "tabular mt-1 font-mono text-xl",
                    s.score > 0
                      ? "text-up"
                      : s.score < 0
                        ? "text-down"
                        : "text-muted-foreground"
                  )}
                >
                  {s.score > 0 ? "+" : ""}
                  {s.score}
                  <span className="ml-1 text-[10px] text-faint">
                    / ±{s.range}
                  </span>
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">
                  {s.detail}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DeskSection>

      <DeskSection
        label="Trade setup"
        aside={
          tick.atr
            ? `ATR ${tick.atr.toFixed(3)} · SL 0.8× · T1 1× · T2 2× · T3 3×`
            : undefined
        }
      >
        <Card className="gap-0 py-4">
          <CardContent className="px-4">
            {tick.trade_dir ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "font-sans text-[15px] font-semibold tracking-[0.06em]",
                      tick.trade_dir === "LONG" ? "text-up" : "text-down"
                    )}
                  >
                    {tick.trade_dir === "LONG" ? "▲ LONG" : "▼ SHORT"}
                  </span>
                  <span className="text-[11px] text-faint">
                    {confidenceStars(tick.confidence)} · score and order block
                    agree
                  </span>
                </div>
                <StatGrid columns={5} className="mt-3">
                  <Stat label="Stop loss" value={usd(tick.sl)} tone="down" />
                  <Stat label="Entry" value={usd(tick.entry)} />
                  <Stat label="T1 · 1:1" value={usd(tick.t1)} tone="up" />
                  {/* T2/T3 are withheld on confidence, not absent. "Locked"
                      has to read differently from an em-dash, which would mean
                      the engine had nothing to give. */}
                  <Stat
                    label={`T2 · 2:1${tick.confidence < UNLOCK_AT.t2 ? "" : ""}`}
                    value={
                      tick.confidence >= UNLOCK_AT.t2 && tick.t2 != null
                        ? usd(tick.t2)
                        : "locked"
                    }
                    tone={
                      tick.confidence >= UNLOCK_AT.t2 && tick.t2 != null
                        ? "up"
                        : "muted"
                    }
                    hint={
                      tick.confidence < UNLOCK_AT.t2
                        ? `needs ${UNLOCK_AT.t2}% confidence`
                        : undefined
                    }
                  />
                  <Stat
                    label="T3 · 3:1"
                    value={
                      tick.confidence >= UNLOCK_AT.t3 && tick.t3 != null
                        ? usd(tick.t3)
                        : "locked"
                    }
                    tone={
                      tick.confidence >= UNLOCK_AT.t3 && tick.t3 != null
                        ? "up"
                        : "muted"
                    }
                    hint={
                      tick.confidence < UNLOCK_AT.t3
                        ? `needs ${UNLOCK_AT.t3}% confidence`
                        : undefined
                    }
                  />
                </StatGrid>
              </>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                {tick.atr == null
                  ? "No signal — waiting on two completed candles for ATR."
                  : "No signal — the score and the order block do not agree yet."}
              </p>
            )}
          </CardContent>
        </Card>
      </DeskSection>

      <div className="grid gap-3 xl:grid-cols-2 [&>*]:min-w-0">
        <DeskSection
          label="Book imbalance"
          aside="against its own ±1 SD envelope, 30-tick"
        >
          <Card className="gap-0 py-4">
            <CardContent className="px-4">
              <BookImbalanceChart ticks={data.history} />
            </CardContent>
          </Card>
        </DeskSection>

        <DeskSection label="SPY price" aside={`${data.history.length} ticks`}>
          <Card className="gap-0 py-4">
            <CardContent className="px-4">
              <SpyPriceChart ticks={data.history} />
            </CardContent>
          </Card>
        </DeskSection>
      </div>

      <Card className="gap-0 px-4 py-4">
        <StatGrid columns={5}>
          <Stat
            label="LT-Bid"
            value={tick.lt_bid?.toLocaleString() ?? "—"}
            tone="up"
          />
          <Stat
            label="LT-Ask"
            value={tick.lt_ask?.toLocaleString() ?? "—"}
            tone="down"
          />
          <Stat
            label="LT-Diff"
            value={tick.lt_diff?.toLocaleString() ?? "—"}
            tone={(tick.lt_diff ?? 0) >= 0 ? "up" : "down"}
          />
          <Stat
            label="CVD"
            value={tick.cvd?.toLocaleString() ?? "—"}
            tone={(tick.cvd ?? 0) >= 0 ? "up" : "down"}
          />
          <Stat label="Order block" value={tick.ob_dir ?? "no candle yet"} />
        </StatGrid>
        <p className="mt-3 text-[10px] text-faint">
          Schwab NYSE_BOOK + LEVELONE · SPX quote polled, not streamed ·{" "}
          {tick.time}
        </p>
      </Card>
    </DeskPage>
  )
}

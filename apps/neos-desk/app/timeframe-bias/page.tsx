import type { Metadata } from "next"
import fixture from "@/data/timeframe-bias.json"

import { deskGet, endpoint } from "@/lib/api"
import type { TimeframeBiasState, TimeframeFrame } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ago,
  DeskPage,
  DeskPageHeader,
  DeskSection,
  LiveDot,
} from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { TiltArrow, TiltBar, tiltColor } from "@/components/desk/tilt"

export const metadata: Metadata = { title: "Timeframe Bias" }

const timeframeBias = endpoint(
  "/timeframe_bias/api/state",
  fixture as TimeframeBiasState
)

/** Newest-bar age is printed, never a second dimming rule — the cards already
    dim on the fetch verdict, and two staleness tests would eventually disagree. */
function barAgeLabel(frame: TimeframeFrame) {
  const age = frame.barAgeSec
  if (age == null || age <= frame.seconds) return null
  return age >= 3600
    ? `newest bar ${(age / 3600).toFixed(1)}h old`
    : `newest bar ${Math.round(age / 60)}m old`
}

export default async function TimeframeBiasPage() {
  const { data, live, reason } = await deskGet(timeframeBias)
  const a = data.alignment
  // Fresh means the fetch loop is keeping up, not that the tape is moving.
  const barsFresh =
    data.barsAgeSec != null && data.barsAgeSec < data.refresh_sec * 3

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            {data.ticker} · Timeframe Bias
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="One score per timeframe: EMA spread plus the close's stretch from the fast EMA, both divided by ATR so the five are comparable, then squashed with tanh. Inside ±0.15 the reading points sideways — a directionless tape should not render as an arrow twitching between up and down."
        meta={
          <span className="flex flex-col items-end gap-0.5">
            <span className="tabular text-[13px] text-foreground">
              {data.tick.price != null ? data.tick.price.toFixed(2) : "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <LiveDot live={data.tickAgeSec != null && data.tickAgeSec < 30} />
              tick {ago(data.tickAgeSec)} · {data.tick.source ?? "—"}
            </span>
            <span>
              bars {ago(data.barsAgeSec)} · session {data.session}
            </span>
          </span>
        }
      />

      {data.fetchError ? (
        <Alert variant="destructive">
          <AlertTitle>Candle refresh is failing</AlertTitle>
          <AlertDescription>{data.fetchError}</AlertDescription>
        </Alert>
      ) : !barsFresh ? (
        <Alert>
          <AlertTitle>Bars are stale</AlertTitle>
          <AlertDescription>
            Last fetch {ago(data.barsAgeSec)} ago against a {data.refresh_sec}s
            refresh. The arrows below describe an older tape.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&>*]:min-w-0">
        {data.frames.map((f) => {
          const measured = f.tilt != null
          const barAge = barAgeLabel(f)
          return (
            <Card
              key={f.key}
              className={cn(
                "gap-0 py-4",
                !measured && "opacity-55",
                measured && !barsFresh && "opacity-75"
              )}
            >
              <CardContent className="px-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] tracking-[0.18em] text-faint uppercase">
                    {f.label_tf}
                  </span>
                  <span className="tabular text-[12px] text-muted-foreground">
                    {f.close != null ? f.close.toFixed(2) : "--"}
                  </span>
                </div>

                <TiltArrow tilt={f.tilt} arrow={f.arrow} />

                <div
                  className="text-center text-[11px] font-medium"
                  style={{ color: tiltColor(f.tilt) }}
                >
                  {f.label}
                </div>
                {/* A dash, never "0.00". Zero is a measured balance; this is the
                    absence of a measurement. */}
                <div className="mt-0.5 text-center text-[11px] text-faint">
                  {measured
                    ? `tilt ${f.tilt! > 0 ? "+" : ""}${f.tilt!.toFixed(2)}`
                    : "tilt —"}
                </div>

                <TiltBar tilt={f.tilt} className="mt-2.5" />

                <div className="mt-2 text-[10px] leading-relaxed text-faint">
                  {[
                    f.detail,
                    `${f.bars} bars`,
                    barAge,
                    f.live ? "live tick on newest bar" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DeskSection label="Consensus">
        <Card className="gap-0 py-5">
          <CardContent className="px-5">
            <div className="flex flex-wrap items-center gap-5">
              <span
                className="text-5xl leading-none"
                style={{ color: tiltColor(a.score) }}
                aria-hidden
              >
                {a.arrow || "—"}
              </span>
              <div className="min-w-0">
                <div
                  className="font-sans text-[15px] font-semibold tracking-[0.04em]"
                  style={{ color: tiltColor(a.score) }}
                >
                  {a.label}
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {a.score == null
                    ? "No timeframe has enough history yet."
                    : `Mean tilt ${a.score > 0 ? "+" : ""}${a.score.toFixed(
                        2
                      )} over the timeframes that produced a reading.`}
                </p>
              </div>
              {/* Only measured timeframes vote. An unmeasured 4h counted as a
                  flat vote would be a claim about the market, not the desk. */}
              <div className="ml-auto text-[11px] text-faint">
                <span className="font-medium text-up">{a.up}</span> up ·{" "}
                <span className="font-medium text-down">{a.down}</span> down ·{" "}
                <span className="font-medium text-muted-foreground">
                  {a.flat}
                </span>{" "}
                flat ·{" "}
                <span className="font-medium text-foreground">
                  {a.measured}
                </span>
                /{a.total} measured
              </div>
            </div>
            <Separator className="my-4" />
            <p className="font-mono text-[10px] leading-relaxed text-faint">
              {data.method.formula} · flat band ±{data.method.flatBand} · min{" "}
              {data.method.minBars} bars · {data.method.barSource}
            </p>
          </CardContent>
        </Card>
      </DeskSection>
    </DeskPage>
  )
}

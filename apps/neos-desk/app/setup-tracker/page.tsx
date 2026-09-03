import type { Metadata } from "next"
import fixture from "@/data/setup-tracker.json"

import { deskGet, endpoint } from "@/lib/api"
import type { Setup, SetupTrackerState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ago,
  DeskPage,
  DeskPageHeader,
  DeskSection,
  duration,
  LiveDot,
} from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { Cohorts } from "@/app/setup-tracker/cohorts"

export const metadata: Metadata = { title: "Setup Win Rate" }

const setupTracker = endpoint(
  "/setup_tracker/api/state",
  fixture as unknown as SetupTrackerState
)

function num(v: number | null | undefined, digits = 2, suffix = "") {
  return v == null ? "—" : `${v.toFixed(digits)}${suffix}`
}

function ScoreCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string
  value: React.ReactNode
  detail?: string
  tone?: "default" | "good" | "bad" | "dim"
}) {
  return (
    <Card className="gap-0 py-4">
      <CardHeader className="gap-0 px-4 [.border-b]:pb-0">
        <CardTitle className="text-[10px] font-normal tracking-[0.12em] text-faint uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-1">
        <div
          className={cn(
            "tabular font-mono text-2xl",
            tone === "good" && "text-up",
            tone === "bad" && "text-down",
            tone === "dim" && "text-muted-foreground"
          )}
        >
          {value}
        </div>
        {detail ? (
          <CardDescription className="mt-1 text-[11px] text-faint">
            {detail}
          </CardDescription>
        ) : null}
      </CardContent>
    </Card>
  )
}

function OutcomeBadge({ setup }: { setup: Setup }) {
  const r = setup.resolution
  if (!r) return <Badge variant="outline">open</Badge>
  if (r.ambiguous) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="stale" className="cursor-help">
            unverified
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {r.detail || "Feed was down at the touch."}
        </TooltipContent>
      </Tooltip>
    )
  }
  if (r.win === null) return <Badge variant="secondary">expired</Badge>
  return <Badge variant={r.win ? "ok" : "bad"}>{r.outcome}</Badge>
}

function GateBadge({ setup }: { setup: Setup }) {
  const g = setup.gate ?? {}
  if (g.trade_id) return <Badge variant="ok">fired</Badge>
  if (!g.armed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="cursor-help">
            {g.would_fire ? "would fire" : (g.reason ?? "blocked")}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Shadow mode — the gate was consulted, nothing was sent.
        </TooltipContent>
      </Tooltip>
    )
  }
  return <Badge variant="bad">{g.reason ?? "blocked"}</Badge>
}

export default async function SetupTrackerPage() {
  const { data, live, reason } = await deskGet(setupTracker)
  const o = data.scoreboard.overall
  const sample = o.decided ? `${o.wins}W / ${o.losses}L` : "nothing decided yet"

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            Setup Win Rate
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description={`Every setup the desk called, scored against what price did next. Win rule: ${data.rule}.`}
        meta={
          <span className="flex flex-col items-end gap-0.5">
            <span className="flex items-center gap-1.5">
              <LiveDot live={data.feed.connected} />
              feed {data.feed.connected ? num(data.feed.price) : "down"} ·{" "}
              {ago(data.feed.last_tick_age)}
            </span>
            <span>
              {data.armed ? "auto-exec ARMED" : "shadow mode"} ·{" "}
              {data.window_days ? `${data.window_days}d window` : "all time"}
            </span>
          </span>
        }
      />

      {!data.configured ? (
        <Alert variant="destructive">
          <AlertTitle>Ingest is closed</AlertTitle>
          <AlertDescription>
            NEO_INGEST_SECRET is blank on this service, so /setup_tracker/ingest
            answers 503. Reads still work.
          </AlertDescription>
        </Alert>
      ) : null}
      {!data.feed.connected ? (
        <Alert>
          <AlertTitle>Open setups are frozen, not expiring</AlertTitle>
          <AlertDescription>
            No live price is reaching the resolver, so nothing below is
            advancing.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 [&>*]:min-w-0">
        {/* A rate under the sample threshold is shown, dimmed and labelled.
            Hiding it makes the board look broken; printing it boldly lets
            "100% (n=2)" read as a result. */}
        <ScoreCard
          label="Win rate"
          value={num(o.win_rate, 1, "%")}
          detail={o.sample_ok ? sample : `${sample} · under n=${o.min_sample}`}
          tone={
            o.win_rate == null || !o.sample_ok
              ? "dim"
              : o.win_rate >= 50
                ? "good"
                : "bad"
          }
        />
        <ScoreCard
          label="Expectancy"
          value={num(o.expectancy_r, 2, " R")}
          detail={`avg target ${num(o.avg_r_target, 2, " R")}`}
          tone={
            o.expectancy_r == null ? "dim" : o.expectancy_r > 0 ? "good" : "bad"
          }
        />
        <ScoreCard
          label="Decided"
          value={o.decided ?? 0}
          detail={`${o.total ?? 0} setups logged · avg hold ${duration(o.avg_hold_sec)}`}
        />
        <ScoreCard
          label="Open"
          value={o.open ?? 0}
          detail="still being scored"
          tone="dim"
        />
        {/* Expired and unverified sit beside the win rate, never inside it:
            no verdict, and lost measurement, are not losses. */}
        <ScoreCard
          label="Expired"
          value={o.expired ?? 0}
          detail="no verdict — excluded"
          tone="dim"
        />
        <ScoreCard
          label="Unverified"
          value={o.unverified ?? 0}
          detail="resolved while feed was down"
          tone="dim"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <Card className="gap-0 px-4 py-4">
          <Cohorts by={data.scoreboard.by} overall={o} />
        </Card>

        <Card className="gap-0 px-4 py-4">
          <DeskSection label="Open now">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Setup</TableHead>
                  <TableHead>Dir</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">t1 / stop</TableHead>
                  <TableHead className="text-right">Now</TableHead>
                  <TableHead className="text-right">MFE / MAE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.open.length ? (
                  data.open.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.strategy}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.dir === "long" ? "ok" : "bad"}
                          className="px-1.5"
                        >
                          {s.dir}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {num(s.entry)}
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        {num(s.t1)} / {num(s.stop)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {num(s.last_price)}
                      </TableCell>
                      <TableCell className="tabular text-right whitespace-nowrap">
                        <span className="text-up">{num(s.mfe)}</span>
                        <span className="text-faint"> / </span>
                        <span className="text-down">{num(s.mae)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      Nothing open.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DeskSection>
        </Card>
      </div>

      <DeskSection label="Recent setups">
        <Card className="gap-0 overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Dir</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">t1 / stop</TableHead>
                  <TableHead className="text-right">R</TableHead>
                  <TableHead className="text-right">Flow</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Gate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.length ? (
                  data.recent.map((s) => {
                    const tilt = s.context?.flow_tilt
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {new Date(s.created_ts * 1000).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {s.strategy}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={s.dir === "long" ? "ok" : "bad"}
                            className="px-1.5"
                          >
                            {s.dir}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {num(s.entry)}
                        </TableCell>
                        <TableCell className="tabular text-right whitespace-nowrap">
                          {num(s.t1)} / {num(s.stop)}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {num(s.r_target)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "tabular text-right",
                            tilt == null
                              ? "text-muted-foreground"
                              : tilt > 0
                                ? "text-up"
                                : "text-down"
                          )}
                        >
                          {num(tilt)}
                        </TableCell>
                        <TableCell>
                          <OutcomeBadge setup={s} />
                        </TableCell>
                        <TableCell>
                          <GateBadge setup={s} />
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-muted-foreground">
                      No setups yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </DeskSection>

      <DeskSection label="How to read this">
        <Card className="gap-0 px-4 py-4">
          <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
            {data.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Card>
      </DeskSection>
    </DeskPage>
  )
}

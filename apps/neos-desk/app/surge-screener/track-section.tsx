"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { scoreTone, type SURGE_TRACKS } from "@/lib/surge"
import type { SurgePick } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Delta, Meter } from "@/components/desk"

type Track = (typeof SURGE_TRACKS)[number]

const ACCENT_TEXT = {
  warn: "text-warn",
  info: "text-info",
  down: "text-down",
} as const

const ACCENT_BORDER = {
  warn: "border-l-warn",
  info: "border-l-info",
  down: "border-l-down",
} as const

function money(v: number | null | undefined, digits = 2) {
  return v == null ? "—" : `$${v.toFixed(digits)}`
}

export function TrackSection({
  track,
  picks,
  active,
  total,
}: {
  track: Track
  picks: SurgePick[]
  active: number
  total: number
}) {
  const [open, setOpen] = React.useState(true)
  const inactive = Math.max(0, total - active)
  const isPuts = track.id === "t3"

  return (
    <Card className={cn("gap-0 border-l-2 py-0", ACCENT_BORDER[track.accent])}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent/40">
          <Badge
            variant="outline"
            className={cn(
              "mt-0.5 shrink-0 font-mono text-[10px] tracking-[0.1em] uppercase",
              ACCENT_TEXT[track.accent]
            )}
          >
            {track.badge}
          </Badge>
          <div className="min-w-0 flex-1">
            <div className="font-sans text-[13px] font-semibold tracking-[0.04em] uppercase">
              {track.name}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              {track.desc}
            </p>
          </div>
          <span className="mt-0.5 shrink-0 text-[11px] text-muted-foreground">
            {active} active
            {inactive ? `, ${inactive} inactive` : ""}
          </span>
          <ChevronDown
            className={cn(
              "mt-0.5 size-4 shrink-0 text-faint transition-transform",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 bg-secondary/40 px-4 py-2.5">
            {track.criteria.map(([k, v]) => (
              <span key={k} className="text-[10px] text-faint">
                {k}{" "}
                <span className={cn("font-medium", ACCENT_TEXT[track.accent])}>
                  {v}
                </span>
              </span>
            ))}
          </div>
          <Separator />

          {picks.length ? (
            <div className="overflow-x-auto">
              <Table className="text-[12px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">% vs close</TableHead>
                    <TableHead className="text-right">% vs open</TableHead>
                    <TableHead>Option</TableHead>
                    <TableHead>
                      Stop {isPuts ? "↑ reversal" : "↓ tight / riskier"}
                    </TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>
                      Alert
                      <span className="block text-[9px] font-normal text-faint normal-case">
                        first detected
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      Option P&amp;L
                      <span className="block text-[9px] font-normal text-faint normal-case">
                        vs alert ask · ~15m delay
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {picks.map((p, i) => (
                    <PickRow
                      key={p.ticker}
                      pick={p}
                      top={i === 0 && p.active !== false}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyDescription>
                  No picks matched these criteria. Check during market hours, or
                  loosen the parameters.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function PickRow({ pick, top }: { pick: SurgePick; top: boolean }) {
  const isActive = pick.active !== false
  const stopped = !isActive && pick.stopped_out === true
  const score = scoreTone(pick.score)
  const opt = pick.option

  return (
    <TableRow className={cn(!isActive && "opacity-55")}>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-medium",
            isActive ? "text-up" : stopped ? "text-down" : "text-faint"
          )}
        >
          <span
            className={cn(
              "size-[6px] rounded-full",
              isActive ? "bg-up" : stopped ? "bg-down" : "bg-faint"
            )}
          />
          {isActive ? "ACTIVE" : stopped ? "STOPPED" : "INACTIVE"}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-semibold">{pick.ticker}</span>
        {top ? (
          <Badge variant="ok" className="ml-1.5 px-1.5 text-[9px]">
            TOP
          </Badge>
        ) : null}
        {pick.late && isActive && !pick.afternoon ? (
          <Badge variant="special" className="ml-1.5 px-1.5 text-[9px]">
            LATE
          </Badge>
        ) : null}
        {pick.afternoon && isActive ? (
          <Badge variant="info" className="ml-1.5 px-1.5 text-[9px]">
            PM
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className="tabular text-right">{money(pick.price)}</TableCell>
      <TableCell className="text-right">
        <Delta value={pick.chg_close} digits={2} suffix="%" />
      </TableCell>
      <TableCell className="text-right">
        <Delta value={pick.chg_open} digits={2} suffix="%" />
      </TableCell>
      <TableCell>
        {opt ? (
          <span className="flex flex-wrap items-baseline gap-1.5 text-[11px]">
            <Badge
              variant={opt.kind === "call" ? "ok" : "bad"}
              className="px-1.5 text-[9px]"
            >
              {opt.kind.toUpperCase()}
            </Badge>
            <span className="tabular font-medium">{money(opt.strike)}</span>
            <span className="text-faint">{opt.expiry}</span>
            <span className="tabular">{money(opt.ask)}</span>
            <span className="text-faint">{opt.dte}d</span>
          </span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </TableCell>
      <TableCell className="tabular whitespace-nowrap">
        <span className="text-warn">{money(pick.tight_stop)}</span>
        {pick.riskier_stop != null ? (
          <>
            <span className="px-1 text-faint">/</span>
            <span className="text-down">{money(pick.riskier_stop)}</span>
          </>
        ) : (
          <span className="pl-1 text-faint">↑</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Meter
            value={pick.score}
            tone={score.meter}
            className="w-12 shrink-0"
          />
          <span className={cn("tabular font-medium", score.text)}>
            {pick.score}
          </span>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="tabular">{pick.alert_time || "—"}</div>
        {pick.alert_ask != null ? (
          <div className="text-[10px] text-faint">
            ask {money(pick.alert_ask)}
          </div>
        ) : null}
      </TableCell>
      <TableCell className="text-right">
        <PnlCell pick={pick} />
      </TableCell>
    </TableRow>
  )
}

function PnlCell({ pick }: { pick: SurgePick }) {
  if (pick.pnl_pct == null) {
    return <span className="text-[10px] text-faint">fetching…</span>
  }

  return (
    <div className="ml-auto w-28">
      <div className="flex items-center justify-end gap-1.5">
        <Delta
          value={pick.pnl_pct}
          digits={1}
          suffix="%"
          className="font-medium"
        />
        {pick.stopped_out ? (
          <Badge variant="bad" className="px-1.5 text-[9px]">
            STOP HIT
          </Badge>
        ) : null}
      </div>
      {pick.current_ask != null ? (
        <div className="text-[10px] text-faint">
          now {money(pick.current_ask)}
          {pick.alert_ask ? ` ← ${money(pick.alert_ask)}` : ""}
        </div>
      ) : null}
      {/* magnitude bar, capped at 50% move so a blow-up does not flatten the rest */}
      <Meter
        value={Math.min(Math.abs(pick.pnl_pct), 50)}
        max={50}
        tone={pick.stopped_out || pick.pnl_pct < 0 ? "down" : "up"}
        className="mt-1"
      />
    </div>
  )
}

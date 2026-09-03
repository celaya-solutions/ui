"use client"

import * as React from "react"

import type { HeatmapState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ago, compact, LiveDot, Stat, StatGrid } from "@/components/desk"
import { DepthHeatmap } from "@/components/desk/depth-heatmap"

const WINDOW_LABEL: Record<number, string> = {
  300: "5 min",
  900: "15 min",
  1800: "30 min",
}

export function HeatmapPanel({ state }: { state: HeatmapState }) {
  const [venue, setVenue] = React.useState(state.venue_order[0] ?? "ibkr")
  const current = state.venues[venue]
  const [windowSec, setWindowSec] = React.useState(
    current?.controls.window_sec ?? 300
  )
  const [gamma, setGamma] = React.useState(current?.controls.gamma ?? 45)

  // Controls are per venue on the server, so switching venues adopts that
  // venue's stored selection rather than carrying the last one over.
  React.useEffect(() => {
    const c = state.venues[venue]?.controls
    if (c) {
      setWindowSec(c.window_sec)
      setGamma(c.gamma)
    }
  }, [venue, state.venues])

  const columns = React.useMemo(() => {
    const cols = current?.columns ?? []
    if (!cols.length) return cols
    const newest = cols[cols.length - 1].t
    return cols.filter((c) => newest - c.t <= windowSec)
  }, [current, windowSec])

  const last = columns[columns.length - 1]
  const spread =
    last?.ask != null && last?.bid != null ? last.ask - last.bid : null
  const restingBid = last ? last.bids.reduce((sum, [, s]) => sum + s, 0) : null
  const restingAsk = last ? last.asks.reduce((sum, [, s]) => sum + s, 0) : null

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <Tabs value={venue} onValueChange={setVenue}>
          <TabsList>
            {state.venue_order.map((v) => {
              const health = state.venues[v]?.stream
              return (
                <TabsTrigger key={v} value={v} className="gap-1.5 text-[11px]">
                  <LiveDot live={!!health?.connected} />
                  {state.venues[v]?.venue ?? v.toUpperCase()}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="window" className="text-[10px] text-faint uppercase">
            Window
          </Label>
          <Select
            value={String(windowSec)}
            onValueChange={(v) => setWindowSec(Number(v))}
          >
            <SelectTrigger id="window" size="sm" className="w-28 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {state.window_choices.map((w) => (
                <SelectItem key={w} value={String(w)} className="text-[12px]">
                  {WINDOW_LABEL[w] ?? `${w}s`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-48 flex-col gap-1.5">
          <Label htmlFor="gamma" className="text-[10px] text-faint uppercase">
            Contrast · {gamma}
          </Label>
          <Slider
            id="gamma"
            value={[gamma]}
            min={state.gamma_range[0]}
            max={state.gamma_range[1]}
            step={5}
            onValueChange={([v]) => setGamma(v)}
            className="py-1.5"
          />
        </div>

        <span className="ml-auto text-[11px] text-faint">
          {columns.length} columns · one every {state.column_sec}s
        </span>
      </div>

      <Card className="gap-0 py-4">
        <CardContent className="px-4">
          <DepthHeatmap columns={columns} gamma={gamma} height={440} />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] text-faint">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-10 rounded-[1px] bg-linear-to-r from-up/10 to-up" />
              resting bids
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-10 rounded-[1px] bg-linear-to-r from-down/10 to-down" />
              resting asks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-px w-4 bg-foreground" />
              traded price
            </span>
            <span className={cn(!current?.stream?.connected && "text-warn")}>
              {current?.venue} ·{" "}
              {current?.stream?.connected
                ? `streaming, last write ${ago(current.stream.last_write_age)}`
                : (current?.stream?.detail ?? "not streaming")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 px-4 py-4">
        <StatGrid columns={6}>
          <Stat label="Last" value={last?.price?.toFixed(2) ?? "—"} />
          <Stat label="Bid" value={last?.bid?.toFixed(2) ?? "—"} tone="up" />
          <Stat label="Ask" value={last?.ask?.toFixed(2) ?? "—"} tone="down" />
          <Stat
            label="Spread"
            value={spread != null ? spread.toFixed(2) : "—"}
            hint={`${current?.depth ?? 0} levels a side`}
          />
          <Stat
            label="Resting bid"
            value={compact(restingBid)}
            tone="up"
            hint="visible book"
          />
          <Stat
            label="Resting ask"
            value={compact(restingAsk)}
            tone="down"
            hint="visible book"
          />
        </StatGrid>
      </Card>
    </>
  )
}

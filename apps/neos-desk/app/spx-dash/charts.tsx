"use client"

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import type { SpxTick } from "@/lib/types"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"

/**
 * Book imbalance against its own 30-tick volatility.
 *
 * The imbalance is a polarity over time, so it is a line across a zero rule
 * rather than bars — and the standard-deviation envelope is drawn as a band
 * behind it, because the question this panel answers is not "how big is the
 * imbalance" but "is this move large relative to how the book has been
 * behaving". A number outside the band is the signal.
 */
const bookConfig = {
  imbalance: { label: "Imbalance", color: "var(--chart-2)" },
  band: { label: "±1 SD", color: "var(--chart-2)" },
} satisfies ChartConfig

const WINDOW = 30

export function BookImbalanceChart({ ticks }: { ticks: SpxTick[] }) {
  const rows = ticks.map((t, i) => {
    // The engine's book_sd is the deviation around the window MEAN, so the
    // envelope has to be centred there too. Drawn around zero it would sit
    // somewhere the line never goes, and "outside the band" — the only thing
    // this panel is asking — would stop meaning anything.
    const window = ticks
      .slice(Math.max(0, i - WINDOW + 1), i + 1)
      .map((x) => x.imbalance)
      .filter((v): v is number => v != null)
    const mean = window.length
      ? window.reduce((a, b) => a + b, 0) / window.length
      : null
    // book_sd arrives as a percent of the imbalance fraction
    const sd = t.book_sd == null ? null : t.book_sd / 100
    return {
      time: t.time,
      imbalance: t.imbalance,
      band:
        sd == null || mean == null
          ? null
          : ([mean - sd, mean + sd] as [number, number]),
    }
  })

  return (
    <ChartContainer config={bookConfig} className="h-52 w-full">
      <ComposedChart
        data={rows}
        margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
      >
        <CartesianGrid vertical={false} stroke="var(--line-soft)" />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          minTickGap={48}
          tick={{ fontSize: 9 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ fontSize: 9 }}
          tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Area
          dataKey="band"
          stroke="none"
          fill="var(--color-band)"
          fillOpacity={0.14}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          dataKey="imbalance"
          type="monotone"
          stroke="var(--color-imbalance)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <ChartTooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const row = payload[0].payload as (typeof rows)[number]
            const sd = row.band ? ((row.band[1] - row.band[0]) / 2) * 100 : null
            const outside =
              row.imbalance != null && row.band != null
                ? row.imbalance < row.band[0] || row.imbalance > row.band[1]
                : false
            return (
              <div className="rounded-md border border-border bg-popover p-2.5 text-[11px] shadow-md">
                <div className="text-muted-foreground">{label}</div>
                <div className="tabular mt-0.5">
                  imbalance{" "}
                  {row.imbalance == null
                    ? "—"
                    : `${(row.imbalance * 100).toFixed(2)}%`}
                </div>
                <div className="tabular text-faint">
                  ±1 SD {sd == null ? "—" : `${sd.toFixed(3)}%`}
                </div>
                {outside ? (
                  <div className="mt-1 text-warn">outside its own band</div>
                ) : null}
              </div>
            )
          }}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

const priceConfig = {
  price: { label: "SPY", color: "var(--chart-1)" },
} satisfies ChartConfig

export function SpyPriceChart({ ticks }: { ticks: SpxTick[] }) {
  const rows = ticks.map((t) => ({ time: t.time, price: t.price }))

  return (
    <ChartContainer config={priceConfig} className="h-44 w-full">
      <LineChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--line-soft)" />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          minTickGap={48}
          tick={{ fontSize: 9 }}
        />
        <YAxis
          domain={["dataMin - 0.05", "dataMax + 0.05"]}
          tickLine={false}
          axisLine={false}
          width={54}
          tick={{ fontSize: 9 }}
          tickFormatter={(v: number) => v.toFixed(2)}
        />
        <Line
          dataKey="price"
          type="monotone"
          stroke="var(--color-price)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <ChartTooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="rounded-md border border-border bg-popover p-2.5 text-[11px] shadow-md">
                <div className="text-muted-foreground">{label}</div>
                <div className="tabular mt-0.5">
                  {Number(payload[0].value).toFixed(2)}
                </div>
              </div>
            )
          }}
        />
      </LineChart>
    </ChartContainer>
  )
}

"use client"

import {
  Bar,
  BarChart,
  Cell,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import type { LiquidityFlowState } from "@/lib/types"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { compact } from "@/components/desk"

/**
 * Volume by price. Magnitude on an ordered price axis, so: horizontal bars in
 * one hue, price ascending up the y-axis the way a ladder reads. The order
 * blocks are bands behind the bars and the target is a labelled rule — three
 * different kinds of thing, encoded three different ways rather than three
 * more colours of bar.
 */
const config = {
  volume: { label: "Volume", color: "var(--chart-2)" },
} satisfies ChartConfig

export function ProfileChart({ state }: { state: LiquidityFlowState }) {
  // Price order, not volume order — a profile out of sequence is not a profile.
  const rows = [...state.pools].sort((a, b) => a.price - b.price)
  const price = state.price
  const target = state.price_target
  const blocks = [
    ...state.order_blocks.bullish.map((b) => ({ ...b, dir: "bull" as const })),
    ...state.order_blocks.bearish.map((b) => ({ ...b, dir: "bear" as const })),
  ]
  const heaviest = Math.max(...rows.map((r) => r.volume), 1)

  return (
    <ChartContainer config={config} className="h-[28rem] w-full">
      <BarChart
        accessibilityLayer
        data={rows}
        layout="vertical"
        margin={{ left: 8, right: 108, top: 8, bottom: 8 }}
      >
        <XAxis type="number" dataKey="volume" hide />
        <YAxis
          type="category"
          dataKey="price"
          reversed
          tickLine={false}
          axisLine={false}
          width={54}
          interval={0}
          tick={{ fontSize: 10 }}
          tickFormatter={(v: number) => v.toFixed(2)}
        />

        {/* Order blocks sit behind the bars as bands: they are price *ranges*,
            not points, and a band is the only honest shape for a range. */}
        {blocks.map((b, i) => (
          <ReferenceArea
            key={`${b.dir}-${i}`}
            y1={nearest(rows, b.low)}
            y2={nearest(rows, b.high)}
            fill={b.dir === "bull" ? "var(--up)" : "var(--down)"}
            fillOpacity={0.12}
            stroke="none"
          />
        ))}

        {price != null ? (
          <ReferenceLine
            y={nearest(rows, price)}
            stroke="var(--foreground)"
            strokeDasharray="3 3"
            label={{
              value: `last ${price.toFixed(2)}`,
              position: "right",
              fill: "var(--foreground)",
              fontSize: 10,
            }}
          />
        ) : null}
        {target ? (
          <ReferenceLine
            y={nearest(rows, target.price)}
            stroke="var(--warn)"
            label={{
              value: `target ${target.price.toFixed(2)}`,
              position: "right",
              fill: "var(--warn)",
              fontSize: 10,
            }}
          />
        ) : null}

        <ChartTooltip
          cursor={{ fill: "var(--accent)", opacity: 0.35 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const row = payload[0].payload as { price: number; volume: number }
            const inBlock = blocks.find(
              (b) => row.price >= b.low && row.price <= b.high
            )
            return (
              <div className="rounded-md border border-border bg-popover p-2.5 text-[11px] shadow-md">
                <div className="font-medium">{row.price.toFixed(2)}</div>
                <div className="text-muted-foreground">
                  {compact(row.volume)} shares ·{" "}
                  {((row.volume / heaviest) * 100).toFixed(0)}% of the heaviest
                </div>
                {inBlock ? (
                  <div
                    className={inBlock.dir === "bull" ? "text-up" : "text-down"}
                  >
                    inside a {inBlock.dir === "bull" ? "bullish" : "bearish"}{" "}
                    order block
                  </div>
                ) : null}
              </div>
            )
          }}
        />

        <Bar dataKey="volume" radius={2} barSize={8}>
          {rows.map((r) => (
            <Cell
              key={r.price}
              fill="var(--color-volume)"
              // The heaviest shelves are where price has already agreed;
              // opacity carries that without a second hue.
              fillOpacity={0.35 + r.thickness * 0.65}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** Snap a price onto the profile's own bucket grid — a category axis can only
    place a reference on a value it actually has. */
function nearest(rows: { price: number }[], value: number) {
  let best = rows[0]?.price ?? value
  let gap = Infinity
  for (const r of rows) {
    const d = Math.abs(r.price - value)
    if (d < gap) {
      gap = d
      best = r.price
    }
  }
  return best
}

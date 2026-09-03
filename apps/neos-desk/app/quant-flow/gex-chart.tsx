"use client"

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import type { GexStrike } from "@/lib/types"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { compact } from "@/components/desk"

/**
 * Gamma exposure by strike is a *polarity* over an ordered axis: positive
 * exposure pins, negative accelerates. So it gets a diverging horizontal bar
 * chart anchored on zero rather than a magnitude table — where the walls sit
 * relative to spot is the whole read, and the shape carries that in a way a
 * column of numbers does not.
 *
 * Two categories only, so no legend box is needed: the sign is direct-labelled
 * on each bar and the axis names the strike.
 */
const config = {
  netGammaExposure: { label: "Net GEX" },
} satisfies ChartConfig

export function GexChart({
  strikes,
  spot,
}: {
  strikes: GexStrike[]
  spot: number | null
}) {
  // Strike order, not magnitude order — a gamma profile read out of sequence
  // is not a profile.
  const rows = [...strikes].sort((a, b) => a.strike - b.strike)
  const peak = Math.max(...rows.map((r) => Math.abs(r.netGammaExposure)), 1)

  return (
    <ChartContainer config={config} className="h-72 w-full">
      <BarChart
        accessibilityLayer
        data={rows}
        layout="vertical"
        margin={{ left: 8, right: 56, top: 4, bottom: 4 }}
      >
        <XAxis type="number" domain={[-peak * 1.05, peak * 1.05]} hide />
        <YAxis
          type="category"
          dataKey="strike"
          reversed
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => v.toFixed(2)}
        />
        <ReferenceLine x={0} stroke="var(--border)" />
        {/* Spot has no place on a value axis of exposure, so it is called out
            on the strike axis instead — the nearest strike is marked below. */}
        <ChartTooltip
          cursor={{ fill: "var(--accent)", opacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const row = payload[0].payload as GexStrike
            const positive = row.netGammaExposure >= 0
            return (
              <div className="rounded-md border border-border bg-popover p-2.5 text-[11px] shadow-md">
                <div className="font-medium">
                  Strike {row.strike.toFixed(2)}
                </div>
                <div className={positive ? "text-up" : "text-down"}>
                  {positive ? "+" : "−"}$
                  {compact(Math.abs(row.netGammaExposure))} net GEX
                </div>
                <div className="mt-1 max-w-48 text-muted-foreground">
                  {positive
                    ? "Dealers long gamma here — sells rallies, buys dips. Pins."
                    : "Dealers short gamma here — buys rallies, sells dips. Accelerates."}
                </div>
                {spot ? (
                  <div className="mt-1 text-faint">
                    {(row.strike - spot >= 0 ? "+" : "") +
                      (row.strike - spot).toFixed(2)}{" "}
                    from spot
                  </div>
                ) : null}
              </div>
            )
          }}
        />
        <Bar dataKey="netGammaExposure" radius={4} barSize={16}>
          {rows.map((r) => (
            <Cell
              key={r.strike}
              fill={
                r.netGammaExposure >= 0 ? "var(--chart-1)" : "var(--chart-5)"
              }
            />
          ))}
          <LabelList
            dataKey="netGammaExposure"
            position="right"
            className="fill-muted-foreground"
            fontSize={10}
            formatter={(v) => {
              const n = Number(v)
              return Number.isFinite(n)
                ? `${n >= 0 ? "+" : "−"}$${compact(Math.abs(n))}`
                : ""
            }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

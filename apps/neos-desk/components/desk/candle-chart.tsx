"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type Candle = {
  time: string
  open: number
  high: number
  low: number
  close: number
}

/** A horizontal price band — a fair-value gap, an order block, the tunnel. */
export type PriceBand = {
  top: number
  bottom: number
  tone: "up" | "down" | "info" | "warn" | "special"
  label?: string
}

/** A horizontal rule at one price — a pivot, a liquidity pool, the target. */
export type PriceLevel = {
  price: number
  label: string
  tone: "up" | "down" | "info" | "warn" | "special" | "muted"
  dashed?: boolean
}

/** A point on a candle — a sweep, an entry. */
export type CandleMarker = {
  index: number
  price: number
  dir: "up" | "down"
  label?: string
}

const TONE: Record<string, string> = {
  up: "var(--up)",
  down: "var(--down)",
  info: "var(--info)",
  warn: "var(--warn)",
  special: "var(--special)",
  muted: "var(--muted-foreground)",
}

/**
 * A candlestick chart with price-band and price-level overlays.
 *
 * Recharts has no candle mark and the desk's structure overlays (gaps, blocks,
 * tunnels) are price *ranges* rather than series, so this is drawn directly.
 * It measures its own box rather than scaling a viewBox, so hairlines stay
 * hairlines at any width — a stretched 1px rule is the tell of a faked chart.
 */
export function CandleChart({
  candles,
  bands = [],
  levels = [],
  markers = [],
  height = 320,
  className,
}: {
  candles: Candle[]
  bands?: PriceBand[]
  levels?: PriceLevel[]
  markers?: CandleMarker[]
  height?: number
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  const [hover, setHover] = React.useState<number | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const PAD = { top: 10, right: 64, bottom: 20, left: 8 }
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = Math.max(0, height - PAD.top - PAD.bottom)

  // Price domain covers the candles *and* every overlay — an order block drawn
  // off the top of the panel is worse than no order block.
  const { lo, hi } = React.useMemo(() => {
    const values: number[] = []
    for (const c of candles) values.push(c.high, c.low)
    for (const b of bands) values.push(b.top, b.bottom)
    for (const l of levels) values.push(l.price)
    if (!values.length) return { lo: 0, hi: 1 }
    const min = Math.min(...values)
    const max = Math.max(...values)
    const pad = (max - min) * 0.06 || 0.5
    return { lo: min - pad, hi: max + pad }
  }, [candles, bands, levels])

  const y = (price: number) => PAD.top + ((hi - price) / (hi - lo)) * plotH
  const step = candles.length ? plotW / candles.length : 0
  const bodyW = Math.max(1, Math.min(9, step * 0.62))
  const x = (i: number) => PAD.left + step * (i + 0.5)

  const active = hover != null ? candles[hover] : null

  // Two levels a cent apart draw two labels on the same line. Nudge each one
  // down until it clears the last — the rule still sits at the true price, only
  // its label moves, so nothing is misreported.
  const labelled = React.useMemo(() => {
    const LINE = 11
    let lastY = -Infinity
    return levels
      .map((l, i) => ({ level: l, i, y: y(l.price) }))
      .sort((a, b) => a.y - b.y)
      .map((entry) => {
        const labelY = Math.max(entry.y, lastY + LINE)
        lastY = labelY
        return { ...entry, labelY }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, lo, hi, plotH])

  return (
    <div
      ref={ref}
      className={cn("relative w-full", className)}
      style={{ height }}
    >
      {width > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${candles.length} candles from ${candles[0]?.time ?? ""} to ${
            candles[candles.length - 1]?.time ?? ""
          }`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const i = Math.floor((e.clientX - rect.left - PAD.left) / step)
            setHover(i >= 0 && i < candles.length ? i : null)
          }}
        >
          {/* bands sit behind everything: they are context, not data */}
          {bands.map((b, i) => {
            const top = y(Math.max(b.top, b.bottom))
            const bottom = y(Math.min(b.top, b.bottom))
            return (
              <g key={`band-${i}`}>
                <rect
                  x={PAD.left}
                  y={top}
                  width={plotW}
                  height={Math.max(1, bottom - top)}
                  fill={TONE[b.tone]}
                  fillOpacity={0.1}
                />
                {b.label ? (
                  <text
                    x={PAD.left + 4}
                    y={top + 9}
                    fontSize={9}
                    fill={TONE[b.tone]}
                    opacity={0.85}
                  >
                    {b.label}
                  </text>
                ) : null}
              </g>
            )
          })}

          {labelled.map(({ level: l, i, y: lineY, labelY }) => (
            <g key={`level-${i}`}>
              <line
                x1={PAD.left}
                x2={PAD.left + plotW}
                y1={lineY}
                y2={lineY}
                stroke={TONE[l.tone]}
                strokeWidth={1}
                strokeDasharray={l.dashed ? "3 3" : undefined}
                opacity={0.7}
              />
              {/* a leader from the rule to a label that had to move */}
              {Math.abs(labelY - lineY) > 1 ? (
                <line
                  x1={PAD.left + plotW}
                  x2={PAD.left + plotW + 4}
                  y1={lineY}
                  y2={labelY - 3}
                  stroke={TONE[l.tone]}
                  strokeWidth={1}
                  opacity={0.45}
                />
              ) : null}
              <text
                x={PAD.left + plotW + 5}
                y={labelY + 3}
                fontSize={9}
                fill={TONE[l.tone]}
              >
                {l.label}
              </text>
            </g>
          ))}

          {candles.map((c, i) => {
            const rising = c.close >= c.open
            const colour = rising ? TONE.up : TONE.down
            const top = y(Math.max(c.open, c.close))
            const bottom = y(Math.min(c.open, c.close))
            return (
              <g
                key={`${c.time}-${i}`}
                opacity={hover == null || hover === i ? 1 : 0.72}
              >
                <line
                  x1={x(i)}
                  x2={x(i)}
                  y1={y(c.high)}
                  y2={y(c.low)}
                  stroke={colour}
                  strokeWidth={1}
                />
                <rect
                  x={x(i) - bodyW / 2}
                  y={top}
                  width={bodyW}
                  /* a doji still needs a mark, so never zero height */
                  height={Math.max(1, bottom - top)}
                  fill={colour}
                  rx={1}
                />
              </g>
            )
          })}

          {markers.map((m, i) => (
            <g key={`marker-${i}`}>
              <circle
                cx={x(m.index)}
                cy={y(m.price)}
                r={3.5}
                fill={m.dir === "up" ? TONE.up : TONE.down}
                stroke="var(--card)"
                strokeWidth={1.5}
              />
            </g>
          ))}

          {hover != null && active ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          ) : null}
        </svg>
      ) : null}

      {active ? (
        <div className="pointer-events-none absolute top-2 left-2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-[10px] shadow-md">
          <div className="text-muted-foreground">{active.time}</div>
          <div className="tabular mt-0.5 flex gap-2">
            <span>O {active.open.toFixed(2)}</span>
            <span>H {active.high.toFixed(2)}</span>
            <span>L {active.low.toFixed(2)}</span>
            <span
              className={active.close >= active.open ? "text-up" : "text-down"}
            >
              C {active.close.toFixed(2)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

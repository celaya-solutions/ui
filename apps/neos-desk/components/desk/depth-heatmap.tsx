"use client"

import * as React from "react"

import type { HeatmapColumn } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Resting depth painted per price over time — one column per snapshot, one cell
 * per price level, cell brightness carrying size.
 *
 * Canvas rather than SVG: a five-minute window at two seconds a column is 150
 * columns × 20 levels, and 3,000 DOM nodes repainting on every frame is the
 * thing this chart cannot afford. Bids and asks are two sequential ramps from a
 * shared dark ground, so the inside market reads as the seam between them.
 */
export function DepthHeatmap({
  columns,
  gamma,
  height = 420,
  className,
}: {
  columns: HeatmapColumn[]
  /** Contrast curve, 10–90. Low lifts the quiet levels, high isolates the walls. */
  gamma: number
  height?: number
  className?: string
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [size, setSize] = React.useState({ w: 0, h: height })
  const [hover, setHover] = React.useState<{
    x: number
    y: number
    column: HeatmapColumn
    price: number
    size: number
    side: "bid" | "ask"
  } | null>(null)

  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: height })
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [height])

  // Price domain across the whole window, so a cell does not move rows when a
  // new column arrives — a ladder that reflows is unreadable.
  const domain = React.useMemo(() => {
    let lo = Infinity
    let hi = -Infinity
    for (const c of columns) {
      for (const [p] of c.bids) {
        if (p < lo) lo = p
        if (p > hi) hi = p
      }
      for (const [p] of c.asks) {
        if (p < lo) lo = p
        if (p > hi) hi = p
      }
    }
    if (!Number.isFinite(lo)) return null
    return { lo: Math.round(lo * 100), hi: Math.round(hi * 100) }
  }, [columns])

  const peak = React.useMemo(() => {
    let max = 0
    for (const c of columns) {
      for (const [, s] of c.bids) if (s > max) max = s
      for (const [, s] of c.asks) if (s > max) max = s
    }
    return max || 1
  }, [columns])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !domain || !size.w) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const styles = getComputedStyle(canvas)
    const ground = styles.getPropertyValue("--background").trim()
    ctx.fillStyle = ground || "#0a0c0f"
    ctx.fillRect(0, 0, size.w, size.h)

    const ticks = domain.hi - domain.lo + 1
    const colW = size.w / Math.max(columns.length, 1)
    const rowH = size.h / Math.max(ticks, 1)
    // gamma 10 → exponent 2 (lifts the quiet levels)
    // gamma 90 → exponent 0.4 (isolates the walls)
    const exponent = 2 - ((gamma - 10) / 80) * 1.6

    const paint = (
      cells: [number, number][],
      x: number,
      hue: [number, number, number]
    ) => {
      for (const [price, sz] of cells) {
        const row = domain.hi - Math.round(price * 100)
        const intensity = Math.pow(Math.min(sz / peak, 1), exponent)
        ctx.fillStyle = `rgba(${hue[0]}, ${hue[1]}, ${hue[2]}, ${(
          0.06 +
          intensity * 0.94
        ).toFixed(3)})`
        ctx.fillRect(x, row * rowH, Math.max(colW, 1), Math.max(rowH, 1))
      }
    }

    columns.forEach((c, i) => {
      const x = i * colW
      paint(c.bids, x, [63, 224, 143])
      paint(c.asks, x, [255, 93, 93])
    })

    // the traded price, drawn over the book it moved through
    ctx.strokeStyle = "rgba(230, 237, 243, 0.75)"
    ctx.lineWidth = 1
    ctx.beginPath()
    let started = false
    columns.forEach((c, i) => {
      if (c.price == null) return
      const row = domain.hi - Math.round(c.price * 100)
      const x = i * colW + colW / 2
      const y = row * rowH + rowH / 2
      if (!started) {
        ctx.moveTo(x, y)
        started = true
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
  }, [columns, domain, gamma, peak, size])

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!domain || !columns.length) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const i = Math.min(
      columns.length - 1,
      Math.max(0, Math.floor((px / rect.width) * columns.length))
    )
    const ticks = domain.hi - domain.lo + 1
    const row = Math.floor((py / rect.height) * ticks)
    const priceTicks = domain.hi - row
    const price = priceTicks / 100
    const column = columns[i]
    const bid = column.bids.find(([p]) => Math.round(p * 100) === priceTicks)
    const ask = column.asks.find(([p]) => Math.round(p * 100) === priceTicks)
    if (!bid && !ask) return setHover(null)
    setHover({
      x: px,
      y: py,
      column,
      price,
      size: (bid ?? ask)![1],
      side: bid ? "bid" : "ask",
    })
  }

  if (!columns.length) {
    return (
      <div
        className={cn(
          "grid place-items-center text-[12px] text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        No columns yet — a gap in the heatmap is honest, a stretched one is not.
      </div>
    )
  }

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height }}
        className="block rounded-[3px] border border-border"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      />
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-2.5 py-1.5 text-[10px] shadow-md"
          style={{
            left: Math.min(hover.x + 12, size.w - 150),
            top: Math.min(hover.y + 12, height - 70),
          }}
        >
          <div className="text-muted-foreground">{hover.column.time}</div>
          <div className="tabular mt-0.5 font-medium">
            {hover.price.toFixed(2)}
          </div>
          <div className={hover.side === "bid" ? "text-up" : "text-down"}>
            {hover.size.toLocaleString()} resting on the {hover.side}
          </div>
        </div>
      ) : null}
    </div>
  )
}

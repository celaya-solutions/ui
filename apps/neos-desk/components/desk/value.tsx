import * as React from "react"

import { cn } from "@/lib/utils"

/** The views' em-dash for "no reading yet" — never a bare 0, which is a price. */
export const EMPTY = "—"

export function fmt(
  value: number | null | undefined,
  digits = 2,
  fallback: string = EMPTY
) {
  if (value == null || Number.isNaN(value)) return fallback
  return value.toFixed(digits)
}

/** Compact magnitude, the `k/M/B` shortener repeated across the views. */
export function compact(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return EMPTY
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(value / 1e9).toFixed(digits)}B`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(digits)}M`
  if (abs >= 1e3) return `${(value / 1e3).toFixed(digits)}k`
  return value.toFixed(abs < 10 ? digits : 0)
}

/** Seconds-since as the views render it: 45s · 12m · 3.4h. */
export function ago(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return EMPTY
  if (seconds < 90) return `${Math.round(seconds)}s`
  if (seconds < 5400) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

/** Elapsed duration: 2h 13m · 13m 4s. */
export function duration(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return EMPTY
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m ${Math.floor(seconds % 60)}s`
}

/**
 * A signed number that carries its own colour — green up, red down, dim flat.
 * The `.up` / `.down` classes the views applied by hand.
 */
export function Delta({
  value,
  digits = 2,
  suffix,
  showSign = true,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  value: number | null | undefined
  digits?: number
  suffix?: string
  showSign?: boolean
}) {
  const known = value != null && !Number.isNaN(value)
  const sign = !known || !showSign ? "" : value > 0 ? "+" : ""

  return (
    <span
      className={cn(
        "tabular",
        !known && "text-muted-foreground",
        known && value > 0 && "text-up",
        known && value < 0 && "text-down",
        known && value === 0 && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {known ? `${sign}${value.toFixed(digits)}${suffix ?? ""}` : EMPTY}
    </span>
  )
}

/** A horizontal fill bar — the pressure/score meters the views drew with divs. */
export function Meter({
  value,
  max = 100,
  tone = "primary",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  value: number | null | undefined
  max?: number
  tone?: "primary" | "up" | "down" | "warn" | "info" | "special" | "muted"
}) {
  const pct =
    value == null || Number.isNaN(value)
      ? 0
      : Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div
      role="meter"
      aria-valuenow={value ?? undefined}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "primary" && "bg-primary",
          tone === "up" && "bg-up",
          tone === "down" && "bg-down",
          tone === "warn" && "bg-warn",
          tone === "info" && "bg-info",
          tone === "special" && "bg-special",
          tone === "muted" && "bg-faint"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** The header `●` that says a feed is streaming. */
export function LiveDot({
  live,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & { live?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-[7px] shrink-0 rounded-full",
        live ? "animate-[pulse-ring_2s_infinite] bg-primary" : "bg-faint",
        className
      )}
      {...props}
    />
  )
}

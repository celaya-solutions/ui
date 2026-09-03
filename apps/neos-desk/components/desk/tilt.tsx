import * as React from "react"

import { cn } from "@/lib/utils"

/** Inside this band the reading points sideways. Mirrors core/timeframes.py. */
export const FLAT_BAND = 0.15

/**
 * Bias is a polarity, so it gets a diverging scale: one hue each way from a
 * neutral grey midpoint, never a rainbow. Grey inside the flat band is a
 * measured balance — an unmeasured timeframe renders as a dash instead, so the
 * two are never confused.
 *
 * Built with color-mix over the theme tokens rather than baked rgb, so the
 * ramp follows the palette if the palette moves.
 */
export function tiltColor(tilt: number | null | undefined) {
  if (tilt == null) return "var(--muted-foreground)"
  const m = Math.min(Math.abs(tilt), 1)
  if (m < FLAT_BAND) return "var(--muted-foreground)"
  const k = Math.min((m - FLAT_BAND) / 0.55, 1)
  const pole = tilt > 0 ? "var(--up)" : "var(--down)"
  return `color-mix(in oklab, var(--muted-foreground) ${((1 - k) * 100).toFixed(1)}%, ${pole} ${(k * 100).toFixed(1)}%)`
}

/**
 * A centre-anchored magnitude bar: the fill grows out of the midline toward the
 * side the reading leans. Zero length at the centre is a real reading of
 * "balanced", which a left-anchored bar could not say.
 */
export function TiltBar({
  tilt,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & { tilt: number | null }) {
  const magnitude = tilt == null ? 0 : Math.min(Math.abs(tilt), 1) * 50
  const left = tilt == null ? 50 : tilt >= 0 ? 50 : 50 - magnitude

  return (
    <div
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      {/* the midline, so "which side" is readable without reading the number */}
      <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
      <span
        className="absolute inset-y-0 rounded-full transition-[left,width,background] duration-500"
        style={{
          left: `${left}%`,
          width: `${magnitude.toFixed(1)}%`,
          background: tiltColor(tilt),
        }}
      />
    </div>
  )
}

/**
 * The arrow glyph, tilted off vertical and slid along its track by magnitude.
 * The rotation is small (±22°) on purpose — the glyph already carries the
 * direction, so this is the magnitude, not a second copy of the sign.
 */
export function TiltArrow({
  tilt,
  arrow,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  tilt: number | null
  arrow: string
}) {
  const clamped = tilt == null ? 0 : Math.max(-1, Math.min(1, tilt))
  const transform =
    tilt == null
      ? undefined
      : `translateY(${(-clamped * 14).toFixed(1)}px) rotate(${(-clamped * 22).toFixed(1)}deg)`

  return (
    <div
      className={cn("grid h-14 place-items-center", className)}
      aria-hidden
      {...props}
    >
      <span
        className="text-3xl leading-none transition-[transform,color] duration-500"
        style={{ transform, color: tiltColor(tilt) }}
      >
        {arrow || "—"}
      </span>
    </div>
  )
}

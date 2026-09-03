import type { SqueezeRow } from "@/lib/types"

/**
 * SPI is a magnitude, so its colour is a sequential ramp rather than four
 * unrelated hues: faint → info → warn → down as pressure climbs. Every use
 * pairs it with the numeric SPI and the status word, so the ramp is never
 * the only thing carrying the reading.
 */
export type SpiBand = "active" | "building" | "watch" | "weak"

export function spiBand(spi: number): SpiBand {
  if (spi >= 75) return "active"
  if (spi >= 50) return "building"
  if (spi >= 30) return "watch"
  return "weak"
}

export const SPI_BAND: Record<
  SpiBand,
  { label: string; text: string; meter: "down" | "warn" | "info" | "muted" }
> = {
  active: { label: "ACTIVE", text: "text-down", meter: "down" },
  building: { label: "BUILDING", text: "text-warn", meter: "warn" },
  watch: { label: "WATCH", text: "text-info", meter: "info" },
  // Weak is the bottom of the ramp, so it reads grey. A green bar here would
  // say "good" about the names with the least pressure behind them.
  weak: { label: "WEAK", text: "text-faint", meter: "muted" },
}

/** Entry zones are categories, not a ramp — three fixed hues, never cycled. */
export const ZONE: Record<
  1 | 2 | 3,
  {
    label: string
    short: string
    text: string
    variant: "special" | "info" | "stale"
  }
> = {
  1: {
    label: "Z1 Pre-squeeze",
    short: "Z1 Pre",
    text: "text-special",
    variant: "special",
  },
  2: {
    label: "Z2 Ignition",
    short: "Z2 Ignition",
    text: "text-info",
    variant: "info",
  },
  3: {
    label: "Z3 Chase",
    short: "Z3 Chase",
    text: "text-warn",
    variant: "stale",
  },
}

export const EXIT_TONE: Record<string, string> = {
  green: "text-up",
  yellow: "text-warn",
  red: "text-down",
}

/** Reward:risk — the desk's own thresholds, 3+ good, 2+ tolerable, below poor. */
export function rrTone(rr: number | null | undefined) {
  if (rr == null) return "text-muted-foreground"
  if (rr >= 3) return "text-up"
  if (rr >= 2) return "text-warn"
  return "text-down"
}

export function squeezeSummary(rows: SqueezeRow[]) {
  const byRank = [...rows].sort(
    (a, b) => (b.entry_rank ?? 0) - (a.entry_rank ?? 0)
  )
  const bySpi = [...rows].sort((a, b) => b.spi - a.spi)
  const top = byRank[0]

  return {
    total: rows.length,
    active: rows.filter((r) => r.spi >= 75).length,
    building: rows.filter((r) => r.spi >= 50 && r.spi < 75).length,
    watch: rows.filter((r) => r.spi >= 30 && r.spi < 50).length,
    zone1: rows.filter((r) => r.entry_zone === 1).length,
    zone2: rows.filter((r) => r.entry_zone === 2).length,
    topEntry: top ? `${top.ticker} #${(top.entry_rank ?? 0).toFixed(0)}` : null,
    bestRr: top ? `${top.ticker} ${(top.rr ?? 0).toFixed(1)}:1` : null,
    topSpi: bySpi[0]?.spi ?? null,
    pullbackActive: rows.filter((r) => r.pullback_active),
    pullbackNear: rows.filter((r) => r.pullback_near && !r.pullback_active),
  }
}

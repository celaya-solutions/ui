import type { SpxTick } from "@/lib/types"

/** Sum of the five signals' extremes: book ±2, cvd ±1, mom ±1, ob ±2, trend ±1. */
export const MAX_SCORE = 7

/** ATR multiples the engine sizes levels off. */
export const LEVEL_MULTS = { sl: 0.8, t1: 1, t2: 2, t3: 3 } as const

/**
 * T2 and T3 are gated on confidence, not on whether the engine computed them.
 * "Locked" is a deliberate withhold and has to read differently from an
 * em-dash, which means there was nothing to give.
 */
export const UNLOCK_AT = { t2: 30, t3: 60 } as const

export type SignalRow = {
  key: string
  name: string
  score: number
  detail: string
  /** Range this signal contributes, for the ±n caption. */
  range: 1 | 2
}

const signed = (v: number, digits = 0) =>
  `${v > 0 ? "+" : ""}${digits ? v.toFixed(digits) : v}`

export function signalRows(tick: SpxTick): SignalRow[] {
  return [
    {
      key: "book",
      name: "Book",
      score: tick.book_score,
      range: 2,
      detail:
        tick.imbalance == null
          ? "No depth"
          : tick.book_score > 0
            ? "Bid dominant"
            : tick.book_score < 0
              ? "Ask dominant"
              : "Balanced",
    },
    {
      key: "cvd",
      name: "CVD",
      score: tick.cvd_score,
      range: 1,
      detail: tick.cvd == null ? "—" : `CVD ${signed(tick.cvd)}`,
    },
    {
      key: "mom",
      name: "Momentum",
      score: tick.mom_score,
      range: 1,
      detail: tick.cvd_delta == null ? "—" : `Δ ${signed(tick.cvd_delta, 2)}`,
    },
    {
      key: "ob",
      name: "Order block",
      score: tick.ob_score,
      range: 2,
      detail: tick.ob_dir ?? "No candle yet",
    },
    {
      key: "trend",
      name: "Trend",
      score: tick.trend_score,
      range: 1,
      detail:
        tick.trend_delta == null ? "—" : `Δ $${signed(tick.trend_delta, 3)}`,
    },
  ]
}

/** The book's own volatility, banded the way the view reads it out. */
export function bookSdVerdict(sd: number | null) {
  if (sd == null)
    return { label: "Not enough ticks yet", tone: "muted" as const }
  if (sd > 0.3)
    return { label: "HIGH — book swinging hard", tone: "down" as const }
  if (sd > 0.15)
    return { label: "ELEVATED — watch for OB flip", tone: "warn" as const }
  return { label: "Normal book volatility", tone: "muted" as const }
}

export function confidenceStars(confidence: number) {
  if (confidence >= 60) return "★★★ HIGH"
  if (confidence >= 30) return "★★ MED"
  return "★ LOW"
}

/** The headline badge: a live setup outranks the raw score's direction. */
export function headlineSignal(tick: SpxTick | null) {
  if (!tick) return { label: "—", tone: "muted" as const }
  if (tick.trade_dir) {
    return tick.trade_dir === "LONG"
      ? { label: "▲ LONG", tone: "up" as const }
      : { label: "▼ SHORT", tone: "down" as const }
  }
  if (tick.total_score > 0) return { label: "◆ BULLISH", tone: "up" as const }
  if (tick.total_score < 0) return { label: "◆ BEARISH", tone: "down" as const }
  return { label: "◆ NEUTRAL", tone: "muted" as const }
}

import type { SurgeTrackId } from "@/lib/types"

export const SURGE_TRACKS: {
  id: SurgeTrackId
  name: string
  badge: string
  desc: string
  /** Categorical, one fixed hue per track — never reassigned by count. */
  accent: "warn" | "info" | "down"
  criteria: [string, string][]
}[] = [
  {
    id: "t1",
    name: "Gap Up Calls",
    badge: "Track 1",
    desc: "Stock up ≥3% from close · breakout in progress · OTM call · ≤7 DTE · prime window 9:32–11:00am ET",
    accent: "warn",
    criteria: [
      ["From close", "≥3%"],
      ["From open", "≥0.3%"],
      ["DTE", "1–7 days"],
      ["Ask", "≤$15"],
      ["Option", "CALL · OTM/near-ATM"],
      ["Stop", "~5% / ~8% below price"],
    ],
  },
  {
    id: "t2",
    name: "Large Cap Breakout Calls",
    badge: "Track 2",
    desc: "Price ≥$50 · small gap 0.5–4.9% from close · tight stop near a technical level · near-ATM call",
    accent: "info",
    criteria: [
      ["From close", "0.5–4.9%"],
      ["From open", "≥0.3%"],
      ["Stock price", "≥$50"],
      ["DTE", "1–7 days"],
      ["Option", "CALL · near-ATM"],
      ["Stop", "technical level (~2–5% below)"],
    ],
  },
  {
    id: "t3",
    name: "Gap Down Puts",
    badge: "Track 3",
    desc: "Stock down ≥5% from close · large cap (≥$50) down ≥2.5% · continuing to fall from open · near-ATM put · stop ABOVE price",
    accent: "down",
    criteria: [
      ["From close", "≤ -5% (large cap ≥$50: ≤ -2.5%)"],
      ["From open", "< 0% (continuing down)"],
      ["DTE", "1–7 days"],
      ["Ask", "≤$15"],
      ["Option", "PUT · near-ATM"],
      ["Stop", "ABOVE current price (reversal exit)"],
    ],
  },
]

export const SURGE_WINDOW: Record<
  string,
  { label: string; detail: string; variant: "ok" | "stale" | "info" | "bad" }
> = {
  prime: {
    label: "Prime window active",
    detail: "9:32–10:30am ET · highest confidence alerts",
    variant: "ok",
  },
  extended: {
    label: "Extended window",
    detail: "10:30am–12:30pm ET · high-momentum late alerts valid",
    variant: "stale",
  },
  afternoon: {
    label: "Afternoon window",
    detail: "12:30–4:00pm ET · late alerts valid",
    variant: "info",
  },
  closed: {
    label: "Outside window / market closed",
    detail: "Showing last cached results",
    variant: "bad",
  },
}

/**
 * Score is a magnitude, so it gets a sequential read rather than four
 * unrelated hues. Every use shows the number beside the bar.
 */
export function scoreTone(score: number) {
  if (score >= 80) return { text: "text-up", meter: "up" } as const
  if (score >= 60) return { text: "text-warn", meter: "warn" } as const
  if (score >= 40) return { text: "text-info", meter: "info" } as const
  return { text: "text-faint", meter: "muted" } as const
}

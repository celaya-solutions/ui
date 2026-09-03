import type { CalendarEventType } from "@/lib/types"

/**
 * Event kinds are categories, so each gets one fixed hue and keeps it —
 * never reassigned by how many kinds a filter leaves on screen. Every use
 * pairs the colour with the kind's name, so the legend is not load-bearing.
 */
export const EVENT_KIND: Record<
  CalendarEventType,
  { label: string; dot: string; text: string }
> = {
  holiday: { label: "Market closed", dot: "bg-down", text: "text-down" },
  halfday: { label: "Half day", dot: "bg-warn", text: "text-warn" },
  fomc: { label: "FOMC decision", dot: "bg-special", text: "text-special" },
  "fomc-week": {
    label: "FOMC week",
    dot: "bg-special/50",
    text: "text-special/80",
  },
  witching: { label: "Witching", dot: "bg-warn", text: "text-warn" },
  opex: { label: "Monthly OpEx", dot: "bg-up", text: "text-up" },
  weekly: { label: "Weekly OpEx", dot: "bg-info", text: "text-info" },
  futures: { label: "Futures", dot: "bg-info/60", text: "text-info/80" },
  earnings: { label: "Earnings", dot: "bg-chart-4", text: "text-special" },
  econ: {
    label: "Econ data",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
  political: { label: "Political", dot: "bg-chart-3", text: "text-warn" },
  seasonal: { label: "Seasonal", dot: "bg-chart-2", text: "text-info" },
  cultural: { label: "Cultural", dot: "bg-faint", text: "text-faint" },
}

/** Kinds that change the session itself, so a day carrying one is marked. */
export const SESSION_KINDS: CalendarEventType[] = ["holiday", "halfday"]

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/** Calendar grid for one month, Sunday-first, padded to whole weeks. */
export function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1))
  const days: (string | null)[] = Array.from(
    { length: first.getUTCDay() },
    () => null
  )
  const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  for (let d = 1; d <= total; d++) {
    days.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    )
  }
  while (days.length % 7) days.push(null)
  return days
}

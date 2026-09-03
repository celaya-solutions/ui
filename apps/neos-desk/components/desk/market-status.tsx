"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type Session = "open" | "pre" | "after" | "closed"

const LABEL: Record<Session, string> = {
  open: "Market Open",
  pre: "Pre-Market",
  after: "After Hours",
  closed: "Closed",
}

/**
 * Session boundaries in minutes past ET midnight, matching shell.html's `tick()`:
 * pre 04:00–09:30, regular 09:30–16:00, after 16:00–20:00.
 */
function sessionAt(et: Date): Session {
  const day = et.getDay()
  if (day === 0 || day === 6) return "closed"
  const mins = et.getHours() * 60 + et.getMinutes()
  if (mins >= 570 && mins < 960) return "open"
  if (mins >= 240 && mins < 570) return "pre"
  if (mins >= 960 && mins < 1200) return "after"
  return "closed"
}

function etNow() {
  // The desk reads one clock and it is New York's, whatever the browser is set to.
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  )
}

export function useEasternClock() {
  // null until mounted: the server has no wall clock the client will agree with,
  // and rendering a time on the server guarantees a hydration mismatch.
  const [now, setNow] = React.useState<Date | null>(null)

  React.useEffect(() => {
    setNow(etNow())
    const id = setInterval(() => setNow(etNow()), 1000)
    return () => clearInterval(id)
  }, [])

  return {
    time: now ? now.toTimeString().slice(0, 8) : "--:--:--",
    session: now ? sessionAt(now) : null,
  }
}

export function MarketStatusBadge({ className }: { className?: string }) {
  const { session } = useEasternClock()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase",
        "border-border bg-secondary text-muted-foreground",
        session === "open" && "border-ring text-primary",
        (session === "pre" || session === "after") &&
          "border-warn/40 text-warn",
        className
      )}
    >
      <span
        className={cn(
          "size-[7px] shrink-0 rounded-full",
          "bg-faint",
          session === "open" && "animate-[pulse-ring_2s_infinite] bg-primary",
          (session === "pre" || session === "after") && "bg-warn"
        )}
      />
      {session ? LABEL[session] : "—"}
    </span>
  )
}

export function EasternClock() {
  const { time } = useEasternClock()

  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="hidden text-[9px] tracking-[0.18em] text-faint uppercase sm:block">
        Clock · ET
      </span>
      <span className="tabular text-[13px] font-medium">{time}</span>
    </div>
  )
}

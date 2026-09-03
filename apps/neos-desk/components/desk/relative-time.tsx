"use client"

import * as React from "react"

import { ago } from "@/components/desk/value"

/**
 * "how long ago", measured against the viewer's clock rather than the build's.
 *
 * These pages prerender, so a `Date.now()` in the server render would freeze at
 * build time and the desk would insist a snapshot was "2s ago" forever. The
 * first paint shows nothing rather than a wrong number, then the client fills
 * it in and keeps it moving.
 */
export function RelativeTime({
  /** Epoch seconds. */
  ts,
  suffix = "ago",
  every = 1000,
}: {
  ts: number | null | undefined
  suffix?: string
  every?: number
}) {
  const [now, setNow] = React.useState<number | null>(null)

  React.useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(id)
  }, [every])

  if (ts == null) return <>—</>
  if (now == null) return <span suppressHydrationWarning>—</span>

  return (
    <span suppressHydrationWarning>
      {ago((now - ts * 1000) / 1000)}
      {suffix ? ` ${suffix}` : ""}
    </span>
  )
}

/**
 * Age in whole days — "Today", "1d ago", "12d ago".
 *
 * Load-bearing on the FDA board: the alert ledger lives on ephemeral storage,
 * and a whole column re-baselining to "Today" is the visible tell that it was
 * wiped. That signal only works if the age is measured against a real clock,
 * so it is computed on the client like RelativeTime.
 */
export function RelativeDays({ ts }: { ts: number | null | undefined }) {
  const [now, setNow] = React.useState<number | null>(null)

  React.useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (ts == null || !Number.isFinite(ts) || ts <= 0) return null
  if (now == null) return <span suppressHydrationWarning />

  const days = Math.floor((now / 1000 - ts) / 86400)
  return (
    <span suppressHydrationWarning>
      {days <= 0 ? "Today" : days === 1 ? "1d ago" : `${days}d ago`}
    </span>
  )
}

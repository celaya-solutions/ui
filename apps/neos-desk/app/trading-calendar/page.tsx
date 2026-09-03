import type { Metadata } from "next"
import calendar from "@/data/trading-calendar.json"

import type { TradingCalendar } from "@/lib/types"
import { DeskPage, DeskPageHeader } from "@/components/desk"
import { CalendarGrid } from "@/app/trading-calendar/calendar-grid"

export const metadata: Metadata = { title: "Trading Calendar" }

const YEAR = 2026

export default function TradingCalendarPage() {
  const data = calendar as TradingCalendar
  const dates = Object.keys(data).length
  const events = Object.values(data).reduce((n, list) => n + list.length, 0)

  return (
    <DeskPage>
      <DeskPageHeader
        title={`NYSE Trading Calendar ${YEAR}`}
        description="Every date the desk treats differently: closures and early closes, FOMC weeks, expirations and rolls, the earnings and prints that set the day's tone. Hover a marked day for what it means for a setup."
        meta={`${events} events across ${dates} dates`}
      />
      {/* This page is static — it ships with the view rather than answering an
          endpoint, so there is no snapshot/live distinction to declare. */}
      <CalendarGrid year={YEAR} calendar={data} />
    </DeskPage>
  )
}

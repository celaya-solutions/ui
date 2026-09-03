"use client"

import * as React from "react"

import { EVENT_KIND, monthGrid, MONTHS, SESSION_KINDS } from "@/lib/calendar"
import type { CalendarEventType, TradingCalendar } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

export function CalendarGrid({
  year,
  calendar,
}: {
  year: number
  calendar: TradingCalendar
}) {
  const [filter, setFilter] = React.useState<CalendarEventType | "all">("all")

  const kinds = React.useMemo(() => {
    const seen = new Set<CalendarEventType>()
    for (const events of Object.values(calendar)) {
      for (const e of events) seen.add(e.type)
    }
    // Legend order follows EVENT_KIND, not the data — a stable order is what
    // lets someone learn the colours once.
    return (Object.keys(EVENT_KIND) as CalendarEventType[]).filter((k) =>
      seen.has(k)
    )
  }, [calendar])

  const visible = (type: CalendarEventType) =>
    filter === "all" || filter === type

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) =>
            setFilter((v || "all") as CalendarEventType | "all")
          }
          variant="outline"
          size="sm"
          className="flex-wrap"
        >
          <ToggleGroupItem value="all" className="px-3 text-[11px]">
            All
          </ToggleGroupItem>
          {kinds.map((k) => (
            <ToggleGroupItem
              key={k}
              value={k}
              className="gap-1.5 px-3 text-[11px]"
            >
              <span className={cn("size-2 rounded-full", EVENT_KIND[k].dot)} />
              {EVENT_KIND[k].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [&>*]:min-w-0">
        {MONTHS.map((name, month) => (
          <Card key={name} className="gap-0 py-3">
            <CardContent className="px-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-sans text-[12px] font-semibold tracking-[0.1em] uppercase">
                  {name}
                </span>
                <span className="text-[10px] text-faint">{year}</span>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[9px] text-faint [&>*]:min-w-0">
                {WEEKDAYS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 [&>*]:min-w-0">
                {monthGrid(year, month).map((iso, i) => {
                  if (!iso) return <span key={i} />
                  const all = calendar[iso] ?? []
                  const events = all.filter((e) => visible(e.type))
                  const session = all.find((e) =>
                    SESSION_KINDS.includes(e.type)
                  )
                  const day = Number(iso.slice(-2))
                  const weekend =
                    new Date(`${iso}T00:00:00Z`).getUTCDay() % 6 === 0

                  const cell = (
                    <div
                      className={cn(
                        "relative aspect-square rounded-[2px] p-1 text-[10px] transition-colors",
                        weekend ? "text-faint" : "text-muted-foreground",
                        events.length && "cursor-help hover:bg-accent",
                        // Session-changing days are tinted, not just dotted:
                        // "is the market even open" outranks every other tag.
                        session?.type === "holiday" && "bg-down/12 text-down",
                        session?.type === "halfday" && "bg-warn/12 text-warn"
                      )}
                    >
                      {day}
                      {events.length ? (
                        <span className="absolute inset-x-1 bottom-1 flex gap-px">
                          {events.slice(0, 4).map((e, j) => (
                            <span
                              key={j}
                              className={cn(
                                "h-[3px] flex-1 rounded-full",
                                EVENT_KIND[e.type].dot
                              )}
                            />
                          ))}
                        </span>
                      ) : null}
                    </div>
                  )

                  if (!events.length)
                    return <React.Fragment key={i}>{cell}</React.Fragment>

                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>{cell}</TooltipTrigger>
                      <TooltipContent className="max-w-72 space-y-2">
                        <div className="text-[10px] text-muted-foreground">
                          {iso}
                        </div>
                        {events.map((e, j) => (
                          <div key={j}>
                            <div
                              className={cn(
                                "font-medium",
                                EVENT_KIND[e.type].text
                              )}
                            >
                              {e.label}
                            </div>
                            {e.detail ? (
                              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                {e.detail}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {kinds.map((k) => {
          const count = Object.values(calendar)
            .flat()
            .filter((e) => e.type === k).length
          return (
            <span key={k} className="flex items-center gap-1.5 text-[11px]">
              <span
                className={cn("size-2.5 rounded-full", EVENT_KIND[k].dot)}
              />
              <span className="text-muted-foreground">
                {EVENT_KIND[k].label}
              </span>
              <Badge variant="outline" className="px-1.5 text-[9px]">
                {count}
              </Badge>
            </span>
          )
        })}
      </div>
    </>
  )
}

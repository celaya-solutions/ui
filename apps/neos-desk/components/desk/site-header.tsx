"use client"

import { usePathname } from "next/navigation"

import { dashboardByHref } from "@/lib/dashboards"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  EasternClock,
  MarketStatusBadge,
} from "@/components/desk/market-status"

export function SiteHeader() {
  const pathname = usePathname()
  const current = dashboardByHref(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-13 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-4" />
      <h1 className="flex min-w-0 items-baseline gap-2.5 font-sans text-[13px] font-semibold tracking-[0.04em]">
        <span className="hidden text-[10px] font-medium tracking-[0.18em] text-faint uppercase sm:inline">
          {current?.group ?? "Desk"}
        </span>
        <span className="truncate">{current?.label ?? "Overview"}</span>
      </h1>
      <div className="ml-auto flex items-center gap-4">
        <EasternClock />
        <MarketStatusBadge />
      </div>
    </header>
  )
}

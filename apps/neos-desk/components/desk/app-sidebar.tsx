"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { dashboardGroups, dashboards } from "@/lib/dashboards"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-border">
      <SidebarHeader className="h-13 justify-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="grid size-6 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-primary font-sans text-[13px] font-extrabold text-primary"
            style={{ boxShadow: "0 0 12px -4px var(--primary)" }}
          >
            N
          </span>
          <span className="leading-none">
            <span className="block font-sans text-[14px] font-extrabold tracking-[0.16em]">
              NEO
            </span>
            <span className="block text-[10px] tracking-[0.22em] text-faint">
              TRADING DESK
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {dashboardGroups.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel className="text-[9px] tracking-[0.24em] text-faint uppercase">
              {group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboards
                  .filter((d) => d.group === group)
                  .map((d) => {
                    const active = pathname === d.href
                    return (
                      <SidebarMenuItem key={d.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={d.blurb}
                          className={cn(
                            "border-l-2 border-transparent",
                            active &&
                              "border-l-primary bg-linear-to-r from-primary/8 to-transparent"
                          )}
                        >
                          <Link href={d.href}>
                            {/* the nav tick from shell.html — lights up on the
                                active row the way the original's did */}
                            <span
                              className={cn(
                                "size-[5px] shrink-0 rounded-[1px] bg-border transition-colors",
                                active &&
                                  "bg-primary shadow-[0_0_8px_var(--primary)]"
                              )}
                            />
                            <span className="truncate">{d.label}</span>
                            {d.live ? (
                              <span className="ml-auto shrink-0 text-[9px] tracking-[0.14em] text-faint uppercase">
                                live
                              </span>
                            ) : null}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-line-soft text-[10px] leading-relaxed text-faint">
        <div>
          One app · one port
          <br />
          <span className="font-medium text-muted-foreground">
            {dashboards.length}
          </span>{" "}
          dashboards · shared core
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The `kv()` helper every view in the Python app hand-rolled: a faint uppercase
 * label over a monospace value. One component now, rather than one string
 * template per dashboard.
 */
function Stat({
  label,
  value,
  hint,
  tone = "default",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: "default" | "up" | "down" | "warn" | "info" | "muted"
}) {
  return (
    <div data-slot="stat" className={cn("min-w-0", className)} {...props}>
      <div className="truncate text-[10px] tracking-[0.08em] text-faint uppercase">
        {label}
      </div>
      <div
        className={cn(
          "tabular mt-0.5 truncate font-mono text-[15px]",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
          tone === "warn" && "text-warn",
          tone === "info" && "text-info",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 truncate text-[10px] text-faint">{hint}</div>
      ) : null}
    </div>
  )
}

/** The `.grid` rule from the views — two columns on phones, wider on desks. */
function StatGrid({
  className,
  columns = 4,
  ...props
}: React.ComponentProps<"div"> & { columns?: 2 | 3 | 4 | 5 | 6 }) {
  return (
    <div
      data-slot="stat-grid"
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-3",
        columns === 3 && "sm:grid-cols-3",
        columns === 4 && "sm:grid-cols-3 lg:grid-cols-4",
        columns === 5 && "sm:grid-cols-3 lg:grid-cols-5",
        columns === 6 && "sm:grid-cols-3 lg:grid-cols-6",
        className
      )}
      {...props}
    />
  )
}

export { Stat, StatGrid }

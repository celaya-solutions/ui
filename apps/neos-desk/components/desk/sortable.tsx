"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { TableHead } from "@/components/ui/table"

export type SortState<K extends string> = { key: K; dir: 1 | -1 }

/**
 * Click-to-sort table state, shared by the three scanners. The Python views
 * each shipped their own `sortBy()` closure over a module-level pair of
 * variables; this is that, once.
 */
export function useSort<T, K extends string>(
  rows: T[],
  initial: SortState<K>,
  read: (row: T, key: K) => string | number | boolean | null | undefined
) {
  const [sort, setSort] = React.useState<SortState<K>>(initial)

  const toggle = React.useCallback((key: K) => {
    // First click on a new column sorts descending — for a scanner, the
    // interesting end of every column is the top.
    setSort((s) =>
      s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: -1 }
    )
  }, [])

  const sorted = React.useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = read(a, sort.key)
      const bv = read(b, sort.key)
      // Nulls sink, whichever way the column is pointing.
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === "string" || typeof bv === "string") {
        return sort.dir * String(av).localeCompare(String(bv))
      }
      return sort.dir * (Number(av) - Number(bv))
    })
    // `read` is a stable module-level function at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort])

  return { sort, toggle, sorted }
}

export function SortHead<K extends string>({
  sortKey,
  sort,
  onSort,
  align = "left",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TableHead>, "onSort"> & {
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  align?: "left" | "right"
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown

  return (
    <TableHead
      aria-sort={
        active ? (sort.dir === 1 ? "ascending" : "descending") : "none"
      }
      className={cn("p-0", className)}
      {...props}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex w-full items-center gap-1 px-2 py-2 text-[10px] tracking-[0.06em] uppercase transition-colors hover:text-foreground",
          align === "right" && "justify-end",
          active && "text-foreground"
        )}
      >
        {align === "right" ? (
          <>
            <Icon className={cn("size-3", !active && "opacity-40")} />
            {children}
          </>
        ) : (
          <>
            {children}
            <Icon className={cn("size-3", !active && "opacity-40")} />
          </>
        )}
      </button>
    </TableHead>
  )
}

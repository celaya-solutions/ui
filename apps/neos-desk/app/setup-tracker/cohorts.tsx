"use client"

import * as React from "react"

import type { CohortScore, OverallScore, SetupGroupField } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Meter } from "@/components/desk"

const FIELDS: { value: SetupGroupField; label: string }[] = [
  { value: "strategy", label: "strategy" },
  { value: "dir", label: "direction" },
  { value: "source", label: "source" },
  { value: "conf_bucket", label: "confidence" },
  { value: "flow_bucket", label: "flow at entry" },
  { value: "session", label: "session" },
  { value: "symbol", label: "symbol" },
]

function num(v: number | null | undefined, digits = 2, suffix = "") {
  return v == null ? "—" : `${v.toFixed(digits)}${suffix}`
}

export function Cohorts({
  by,
  overall,
}: {
  by: Partial<Record<SetupGroupField, CohortScore[]>>
  overall: OverallScore
}) {
  const [field, setField] = React.useState<SetupGroupField>("strategy")
  const rows = by[field] ?? []
  const thin = rows.filter((r) => !r.sample_ok).length

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="text-[12px] tracking-[0.1em] text-muted-foreground uppercase">
          By {FIELDS.find((f) => f.value === field)?.label}
        </span>
        <Select
          value={field}
          onValueChange={(v) => setField(v as SetupGroupField)}
        >
          <SelectTrigger size="sm" className="ml-auto w-40 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELDS.map((f) => (
              <SelectItem key={f.value} value={f.value} className="text-[12px]">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table className="text-[12px]">
        <TableHeader>
          <TableRow>
            <TableHead>Cohort</TableHead>
            <TableHead>Win %</TableHead>
            <TableHead className="text-right">n</TableHead>
            <TableHead className="text-right">Exp R</TableHead>
            <TableHead className="text-right">Ran t2</TableHead>
            <TableHead className="text-right">Avg MFE</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((r) => (
              // Thin cohorts are dimmed, not hidden: a rate over three decided
              // setups is noise, and printing it plainly would read as a result.
              <TableRow
                key={r.key}
                className={cn(!r.sample_ok && "opacity-50")}
              >
                <TableCell className="font-medium">{r.key}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Meter
                      value={r.win_rate ?? 0}
                      tone={
                        r.win_rate == null
                          ? "muted"
                          : r.win_rate >= 50
                            ? "up"
                            : "down"
                      }
                      className="w-12 shrink-0"
                    />
                    <span
                      className={cn(
                        "tabular",
                        r.win_rate == null
                          ? "text-muted-foreground"
                          : r.win_rate >= 50
                            ? "text-up"
                            : "text-down"
                      )}
                    >
                      {num(r.win_rate, 0, "%")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="tabular text-right">
                  {r.decided}
                </TableCell>
                <TableCell
                  className={cn(
                    "tabular text-right",
                    r.expectancy_r == null
                      ? "text-muted-foreground"
                      : r.expectancy_r > 0
                        ? "text-up"
                        : "text-down"
                  )}
                >
                  {num(r.expectancy_r)}
                </TableCell>
                <TableCell className="tabular text-right">
                  {r.ran_to_t2 ?? 0}
                </TableCell>
                <TableCell className="tabular text-right">
                  {num(r.avg_mfe)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                No setups in this window.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {thin ? (
        <p className="text-[11px] text-faint">
          {thin} cohort{thin === 1 ? "" : "s"} dimmed — fewer than{" "}
          {overall.min_sample} decided setups, so the rate is noise, not a
          result.
        </p>
      ) : null}
    </div>
  )
}

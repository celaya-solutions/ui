import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Says out loud whether what you are reading came off the desk or out of a
 * committed snapshot. A dashboard that silently shows stale numbers is worse
 * than one that shows none.
 */
export function SourceBadge({
  live,
  reason,
  capturedAt,
}: {
  live: boolean
  reason?: string
  capturedAt?: string
}) {
  if (live) {
    return (
      <Badge
        variant="ok"
        className="font-mono text-[10px] tracking-[0.12em] uppercase"
      >
        Live
      </Badge>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="stale"
          className="font-mono text-[10px] tracking-[0.12em] uppercase"
        >
          Snapshot
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p>
          Rendering a committed capture{capturedAt ? ` from ${capturedAt}` : ""}
          .{reason ? ` (${reason})` : ""}
        </p>
        <p className="mt-1 text-muted-foreground">
          Set NEXT_PUBLIC_NEOS_BASE_URL to read the desk live.
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

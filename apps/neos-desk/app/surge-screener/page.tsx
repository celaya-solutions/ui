import type { Metadata } from "next"
import fixture from "@/data/surge-scan.json"

import { deskGet, endpoint } from "@/lib/api"
import { SURGE_TRACKS, SURGE_WINDOW } from "@/lib/surge"
import type { SurgeScan } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DeskPage, DeskPageHeader, Stat, StatGrid } from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { TrackSection } from "@/app/surge-screener/track-section"

export const metadata: Metadata = { title: "Surge Screener" }

const surgeScan = endpoint("/surge_screener/api/results", fixture as SurgeScan)

export default async function SurgeScreenerPage() {
  const { data, live, reason } = await deskGet(surgeScan)
  const counts = data.counts ?? {}
  const w = SURGE_WINDOW[data.window] ?? SURGE_WINDOW.closed

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            SurgeBot Screener
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="Three tracks, calls and puts. Only tickers with a real weekly option (bid above $0.05) are shown — that filter is why roughly a dozen picks a day survive from sixty-odd momentum candidates. No option, no alert."
        meta={`Scan ${data.ts} · ${data.date}`}
      />

      {/* Which alert window we are in decides how much the picks below are
          worth, so it leads the page rather than sitting in a corner. */}
      <Card className="gap-0 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant={w.variant}
            className="text-[10px] tracking-[0.12em] uppercase"
          >
            {w.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{w.detail}</span>
        </div>
      </Card>

      <Card className="gap-0 px-4 py-4">
        <StatGrid columns={5}>
          <Stat label="Last scan" value={data.ts} tone="info" />
          <Stat label="Gap up calls" value={counts.t1 ?? 0} tone="warn" />
          <Stat label="Breakout calls" value={counts.t2 ?? 0} tone="info" />
          <Stat label="Gap down puts" value={counts.t3 ?? 0} tone="down" />
          <Stat label="Scan date" value={data.date} />
        </StatGrid>
      </Card>

      {SURGE_TRACKS.map((track) => (
        <TrackSection
          key={track.id}
          track={track}
          picks={data[track.id] ?? []}
          active={counts[track.id] ?? 0}
          total={counts[`${track.id}_total`] ?? counts[track.id] ?? 0}
        />
      ))}
    </DeskPage>
  )
}

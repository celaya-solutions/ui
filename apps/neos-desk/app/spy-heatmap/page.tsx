import type { Metadata } from "next"
import fixture from "@/data/spy-heatmap.json"

import { deskGet, endpoint } from "@/lib/api"
import type { HeatmapState } from "@/lib/types"
import { DeskPage, DeskPageHeader } from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { HeatmapPanel } from "@/app/spy-heatmap/heatmap-panel"

export const metadata: Metadata = { title: "SPY Depth Heatmap" }

const heatmap = endpoint(
  "/spy_heatmap/api/state",
  fixture as unknown as HeatmapState
)

export default async function SpyHeatmapPage() {
  const { data, live, reason } = await deskGet(heatmap)

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            {data.symbol} · Depth Heatmap
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="Resting size at every price, painted over time. Bright horizontal shelves are orders that sat there long enough to matter; the white line is where price actually traded through them. Each venue keeps its own window and contrast, because each venue is a different book."
        meta={`${data.session} session · ${data.max_columns} columns retained`}
      />
      <HeatmapPanel state={data} />
    </DeskPage>
  )
}

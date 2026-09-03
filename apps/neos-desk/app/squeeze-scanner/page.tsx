import type { Metadata } from "next"
import fixture from "@/data/squeeze-scan.json"

import { deskGet, endpoint } from "@/lib/api"
import type { SqueezeScan } from "@/lib/types"
import { DeskPage, DeskPageHeader } from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { SqueezeTable } from "@/app/squeeze-scanner/squeeze-table"

export const metadata: Metadata = { title: "Squeeze Scanner" }

const squeezeScan = endpoint(
  "/squeeze_scanner/api/scan",
  fixture as SqueezeScan
)

export default async function SqueezeScannerPage() {
  const { data, live, reason } = await deskGet(squeezeScan)

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            Mechanical Short Squeeze Scanner
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="Squeeze Pressure Index from short float, days-to-cover, volume surge and momentum. Zone 1 is the pre-squeeze base and carries the best reward:risk; Zone 2 is ignition, where the pullback entry lives; Zone 3 is already a chase."
        meta={`Last scan ${new Date(data.ts * 1000).toLocaleTimeString(
          "en-US",
          {
            timeZone: "America/New_York",
          }
        )} ET`}
      />
      <SqueezeTable rows={data.results} />
    </DeskPage>
  )
}

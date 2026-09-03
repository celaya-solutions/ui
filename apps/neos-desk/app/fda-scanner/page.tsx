import type { Metadata } from "next"
import fixture from "@/data/fda-scan.json"

import { deskGet, endpoint } from "@/lib/api"
import type { FdaScan } from "@/lib/types"
import { DeskPage, DeskPageHeader } from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"
import { FdaTable } from "@/app/fda-scanner/fda-table"

export const metadata: Metadata = { title: "FDA Catalysts" }

const fdaScan = endpoint("/fda_scanner/api/scan", fixture as unknown as FdaScan)

export default async function FdaScannerPage() {
  const { data, live, reason } = await deskGet(fdaScan)

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            FDA Catalyst Scanner
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="SEC EDGAR 8-K filings scored for tradeable FDA events. FCS blends catalyst type, filing freshness and market cap — a PDUFA date filed today on a $300M name scores far above an orphan designation from three weeks ago. Filed ≤3 days is the pre-move window."
        meta={`Last scan ${new Date(data.ts * 1000).toLocaleTimeString(
          "en-US",
          {
            timeZone: "America/New_York",
          }
        )} ET`}
      />
      <FdaTable rows={data.results} catalog={data.catalyst_types} />
    </DeskPage>
  )
}

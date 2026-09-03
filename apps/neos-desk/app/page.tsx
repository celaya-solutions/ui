import Link from "next/link"

import { dashboardGroups, dashboards } from "@/lib/dashboards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DeskPage,
  DeskPageHeader,
  DeskSection,
  LiveDot,
} from "@/components/desk"

export default function OverviewPage() {
  return (
    <DeskPage>
      <DeskPageHeader
        title="Trading Desk"
        description="Every NEO dashboard, rebuilt on shadcn/ui against the same endpoints the aiohttp app serves. The four SPY bookmap variants stay on the Python side, where the canvas depth renderer lives."
        meta={`${dashboards.length} dashboards`}
      />

      {dashboardGroups.map((group) => (
        <DeskSection key={group} label={group}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
            {dashboards
              .filter((d) => d.group === group)
              .map((d) => (
                <Card
                  key={d.name}
                  className="gap-0 py-0 transition-colors hover:border-ring/60"
                >
                  <Link href={d.href} className="block p-4">
                    <CardHeader className="gap-0 px-0 [.border-b]:pb-0">
                      <CardTitle className="flex items-center gap-2 font-sans text-[13px] font-semibold tracking-[0.04em]">
                        <d.icon className="size-3.5 text-muted-foreground" />
                        {d.label}
                        {d.live ? <LiveDot live className="ml-auto" /> : null}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pt-2">
                      <CardDescription className="text-[12px] leading-relaxed">
                        {d.blurb}
                      </CardDescription>
                      <p className="mt-2 font-mono text-[10px] text-faint">
                        dashboards/{d.name}.py
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
          </div>
        </DeskSection>
      ))}
    </DeskPage>
  )
}

import type { Metadata } from "next"
import fixture from "@/data/schwab-auth.json"
import { ExternalLink } from "lucide-react"

import { deskGet, endpoint } from "@/lib/api"
import type { SchwabAuthStatus } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DeskPage,
  DeskPageHeader,
  DeskSection,
  duration,
  Meter,
  RelativeTime,
  Stat,
  StatGrid,
} from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"

export const metadata: Metadata = { title: "Schwab Connect" }

const schwabAuth = endpoint(
  "/schwab_auth/api/status",
  fixture as unknown as SchwabAuthStatus
)

export default async function SchwabAuthPage() {
  const { data, live, reason } = await deskGet(schwabAuth)
  const remaining = data.refresh_expires_in_sec
  // The refresh token is the clock that matters: seven days, then the depth
  // leg goes quiet in a way that looks exactly like a dead page.
  const lifeLeft =
    remaining == null
      ? null
      : Math.max(0, Math.min(100, (remaining / data.ttl_sec) * 100))

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            Schwab Connect
            <Badge variant={data.refresh_expired ? "bad" : "ok"}>
              {data.refresh_expired ? "Re-auth needed" : "Token valid"}
            </Badge>
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="Schwab refresh tokens die every seven days, and a dead one is silent — the depth stream simply stops publishing. This page exists so that failure has a button rather than a mystery."
        meta={`redirect ${data.redirect_uri}`}
      />

      {data.refresh_expired ? (
        <Alert variant="destructive">
          <AlertTitle>The refresh token has expired</AlertTitle>
          <AlertDescription>
            The Schwab depth leg is not publishing. Re-authorize below; the desk
            mints a new token pair on the callback and the stream picks up on
            its own.
          </AlertDescription>
        </Alert>
      ) : remaining != null && remaining < 86400 ? (
        <Alert>
          <AlertTitle>Token expires in under a day</AlertTitle>
          <AlertDescription>
            {duration(remaining)} left. Re-auth now rather than mid-session.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="gap-0 py-4 lg:col-span-2">
          <CardContent className="px-4">
            <StatGrid columns={4}>
              <Stat
                label="Credentials"
                value={data.credentials_configured ? "configured" : "MISSING"}
                tone={data.credentials_configured ? "up" : "down"}
              />
              <Stat
                label="Tokens on disk"
                value={data.have_tokens ? "yes" : "none"}
                tone={data.have_tokens ? "up" : "warn"}
              />
              <Stat
                label="Capture mode"
                value={data.mode}
                hint={data.callback_path}
              />
              <Stat
                label="Depth stream"
                value={data.stream.connected ? "streaming" : "silent"}
                tone={data.stream.connected ? "up" : "down"}
                hint={data.stream.detail ?? undefined}
              />
              <Stat
                label="Token age"
                value={duration(data.refresh_age_sec)}
                hint={`${duration(data.ttl_sec)} lifetime`}
              />
              <Stat
                label="Expires in"
                value={
                  remaining == null
                    ? "—"
                    : remaining <= 0
                      ? "EXPIRED"
                      : duration(remaining)
                }
                tone={
                  remaining == null ? "muted" : remaining <= 0 ? "down" : "up"
                }
              />
              <Stat
                label="Last attempt"
                value={data.last_result?.ok ? "ok" : "failed"}
                tone={data.last_result?.ok ? "up" : "down"}
                hint={
                  data.last_result?.ts ? (
                    <RelativeTime ts={data.last_result.ts} />
                  ) : undefined
                }
              />
              <Stat
                label="Server time"
                value={new Date(data.server_time * 1000).toLocaleTimeString()}
              />
            </StatGrid>

            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[10px] tracking-[0.12em] text-faint uppercase">
                <span>Refresh token life</span>
                <span>
                  {lifeLeft == null ? "—" : `${lifeLeft.toFixed(0)}% left`}
                </span>
              </div>
              <Meter
                value={lifeLeft ?? 0}
                tone={
                  lifeLeft == null || lifeLeft <= 0
                    ? "down"
                    : lifeLeft < 20
                      ? "warn"
                      : "up"
                }
              />
            </div>

            {data.last_result?.message ? (
              <p className="mt-3 font-mono text-[11px] text-faint">
                {data.last_result.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <DeskSection label="Re-authorize">
          <Card className="gap-0 py-4">
            <CardContent className="flex flex-col gap-3 px-4">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Sends you to Schwab&apos;s consent screen. On return the desk
                stores the new token pair and restarts the depth stream — there
                is nothing to copy by hand in{" "}
                <span className="text-foreground">{data.mode}</span> mode.
              </p>
              <Button
                asChild
                disabled={!data.credentials_configured}
                className="w-full"
              >
                {/* Points at the Python app, which owns the OAuth round trip —
                    this app never holds Schwab credentials. */}
                <a href="/schwab_auth/login">
                  Authorize with Schwab
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
              {!data.credentials_configured ? (
                <p className="text-[11px] text-down">
                  SCHWAB_APP_KEY / SCHWAB_APP_SECRET are not set on this
                  deployment, so there is no app to authorize against.
                </p>
              ) : null}
              <p className="text-[11px] leading-relaxed text-faint">
                Callback path{" "}
                <span className="font-mono">{data.callback_path}</span> must
                match the redirect URI registered on the Schwab app exactly,
                byte for byte.
              </p>
            </CardContent>
          </Card>
        </DeskSection>
      </div>
    </DeskPage>
  )
}

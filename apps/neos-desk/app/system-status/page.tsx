import type { Metadata } from "next"
import fixture from "@/data/system-status.json"

import { deskGet, endpoint } from "@/lib/api"
import type { SourceHealth, StreamHealth, SystemStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ago,
  DeskPage,
  DeskPageHeader,
  DeskSection,
  duration,
  fmt,
  Stat,
  StatGrid,
} from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"

export const metadata: Metadata = { title: "System Status" }

const systemStatus = endpoint(
  "/system_status/api/status",
  fixture as SystemStatus
)

type Tone = React.ComponentProps<typeof Stat>["tone"]

/** `off` is not a fault. Credentials are absent; nothing will ever arrive. */
const SOURCE_TONE: Record<string, Tone> = {
  live: "up",
  stale: "warn",
  idle: "warn",
  off: "muted",
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">{children}</CardContent>
    </Card>
  )
}

/**
 * Both depth legs publish an identically shaped health dict and the server
 * hands over a normalised status word, so one renderer covers them — the same
 * `depthCard()` collapse the original view made.
 */
function DepthCard({
  health,
  source,
  extra,
}: {
  health: StreamHealth
  source: SourceHealth
  extra?: React.ReactNode
}) {
  const tone = SOURCE_TONE[source.status ?? ""] ?? "muted"
  const off = source.status === "off"
  const ticking = health.last_write_age != null && health.last_write_age < 30

  return (
    <Panel>
      <StatGrid columns={6}>
        <Stat
          label="Stream"
          value={(source.status ?? "unknown").toUpperCase()}
          tone={tone}
        />
        <Stat label="Detail" value={source.detail || "—"} tone={tone} />
        <Stat
          label="Daemon"
          value={health.daemon_running ? "running" : "stopped"}
          tone={health.daemon_running ? "up" : off ? "muted" : "down"}
        />
        <Stat
          label="Last tick"
          value={ago(health.last_write_age)}
          tone={ticking ? "up" : off ? "muted" : "warn"}
        />
        <Stat label="Connected for" value={duration(health.connected_secs)} />
        <Stat label="Last push" value={ago(health.last_push_age)} />
        {extra}
      </StatGrid>
    </Panel>
  )
}

export default async function SystemStatusPage() {
  const { data, live, reason } = await deskGet(systemStatus)

  const q = data.quantdata ?? {}
  const cache = q.cache ?? {}
  // A retained error with a newer success is history, not a live fault.
  // Measured on the snapshot's own clock (`data.ts` minus the age it reports),
  // not the viewer's — the page prerenders, and the two clocks need not agree.
  const recovered =
    q.last_error != null &&
    q.last_ok_age != null &&
    data.ts - q.last_ok_age > q.last_error.at

  const oauth = data.ibkr_oauth ?? {}
  const ibkr = data.ibkr ?? {}
  const trading = data.trading ?? {}
  const metrics = data.metrics ?? {}
  const deploy = data.deploy ?? {}
  const buses = Object.entries(data.buses ?? {}).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            NEOS Status
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="Feed, broker and scanner health in one place. When something on the desk looks wrong, this page says whether it is the desk or the data."
        meta={`Snapshot ${new Date(data.ts * 1000).toLocaleTimeString()} · up ${duration(
          data.uptime_sec
        )}`}
      />

      <DeskSection label="IBKR Depth Stream" aside="L2 for the bookmaps">
        <DepthCard
          health={data.stream ?? {}}
          source={data.sources?.ibkr ?? {}}
        />
      </DeskSection>

      <DeskSection label="Schwab Depth Stream" aside="L2 for the bookmaps">
        <DepthCard
          health={data.schwab ?? {}}
          source={data.sources?.schwab ?? {}}
          extra={
            // The 7-day refresh cap is this leg's most common outage and it is
            // fixable from a button, so name the button rather than go red.
            <Stat
              label="Refresh token"
              value={
                data.schwab?.refresh_token_expired == null
                  ? "—"
                  : data.schwab.refresh_token_expired
                    ? "EXPIRED — re-auth at Schwab Connect"
                    : "valid"
              }
              tone={
                data.schwab?.refresh_token_expired == null
                  ? "muted"
                  : data.schwab.refresh_token_expired
                    ? "down"
                    : "up"
              }
              className="col-span-2"
            />
          }
        />
      </DeskSection>

      <DeskSection label="IBKR OAuth" aside="market data session">
        <Panel>
          <StatGrid columns={4}>
            <Stat
              label="Enabled"
              value={oauth.enabled ? "yes" : "no"}
              tone={oauth.enabled ? "up" : "muted"}
            />
            <Stat
              label="Session"
              value={oauth.session_ok ? "ok" : "not established"}
              tone={oauth.session_ok ? "up" : oauth.enabled ? "warn" : "muted"}
            />
            <Stat
              label="Live session token"
              value={
                !oauth.enabled ? "—" : oauth.lst_valid ? "valid" : "INVALID"
              }
              tone={!oauth.enabled ? "muted" : oauth.lst_valid ? "up" : "down"}
            />
            <Stat
              label="LST expires in"
              value={duration(oauth.lst_expires_in)}
            />
          </StatGrid>
        </Panel>
      </DeskSection>

      <DeskSection label="IBKR Gateway" aside="order leg">
        <Panel>
          <StatGrid columns={3}>
            <Stat
              label="Broker"
              value={ibkr.connected ? "CONNECTED" : "not connected"}
              tone={
                ibkr.connected ? "up" : ibkr.daemon_running ? "down" : "muted"
              }
            />
            <Stat
              label="Leg"
              value={ibkr.daemon_running ? "armed" : "disabled"}
              tone={ibkr.daemon_running ? "up" : "muted"}
            />
            <Stat label="Account" value={ibkr.account || "—"} />
          </StatGrid>
        </Panel>
      </DeskSection>

      <DeskSection
        label="Quant Data"
        aside="last call the desk actually made — this page never probes the vendor"
      >
        <Panel>
          <StatGrid columns={4}>
            <Stat
              label="Key"
              value={q.configured ? "configured" : "MISSING"}
              tone={q.configured ? "up" : "down"}
            />
            <Stat
              label="Last success"
              value={
                q.last_ok_age == null
                  ? q.calls
                    ? "never succeeded"
                    : "never called"
                  : `${ago(q.last_ok_age)} ago`
              }
              tone={q.last_ok_age == null ? (q.calls ? "down" : "muted") : "up"}
            />
            <Stat
              label="Calls"
              value={`${q.calls ?? 0}${q.errors ? ` · ${q.errors} failed` : ""}`}
              tone={q.errors ? "warn" : "default"}
            />
            <Stat
              label="Cache"
              value={`${cache.fresh ?? 0}/${cache.entries ?? 0} fresh · ${
                cache.ttl_sec ?? 0
              }s TTL`}
            />
            {q.last_error ? (
              <Stat
                label="Last error"
                value={`${q.last_error.status ? `${q.last_error.status} · ` : ""}${String(
                  q.last_error.detail
                ).slice(0, 90)}`}
                tone={recovered ? "muted" : "down"}
                className="col-span-2 lg:col-span-4"
              />
            ) : null}
          </StatGrid>
        </Panel>
      </DeskSection>

      <DeskSection label="Scanners">
        <Panel>
          <div className="flex flex-wrap gap-2">
            {(["squeeze", "surge", "fda"] as const).map((name) => {
              const s = data.scanners?.[name] ?? {}
              const variant =
                s.age_sec == null ? "bad" : s.fresh ? "ok" : "stale"
              const label =
                s.age_sec == null ? "never" : `${ago(s.age_sec)} ago`
              return (
                <Badge
                  key={name}
                  variant={variant}
                  className="font-mono text-[11px]"
                >
                  {name.toUpperCase()} · {label} · {s.count ?? 0}
                </Badge>
              )
            })}
          </div>
        </Panel>
      </DeskSection>

      <DeskSection label="Trading">
        <Panel>
          <StatGrid columns={4}>
            <Stat
              label="Setup"
              value={
                trading.setup_locked
                  ? (trading.setup_dir ?? "LOCKED").toUpperCase()
                  : "none"
              }
              tone={
                !trading.setup_locked
                  ? "muted"
                  : trading.setup_dir === "short"
                    ? "down"
                    : "up"
              }
            />
            <Stat label="Setup age" value={ago(trading.setup_age_sec)} />
            <Stat
              label="Open trades"
              value={trading.open_trades ?? 0}
              tone={(trading.open_trades ?? 0) > 0 ? "up" : "default"}
            />
            <Stat label="Closed trades" value={trading.closed_trades ?? 0} />
            <Stat
              label="Auto-exec"
              value={trading.autoexec_enabled ? "ENABLED" : "off"}
              tone={trading.autoexec_enabled ? "warn" : "muted"}
            />
            {/* An open breaker and a non-empty DLQ both mean autonomous firing
                has already stopped or failed — worth seeing at a glance. */}
            <Stat
              label="Circuit"
              value={trading.autoexec_circuit_open ? "OPEN" : "closed"}
              tone={trading.autoexec_circuit_open ? "down" : "muted"}
            />
            <Stat
              label="DLQ"
              value={trading.autoexec_dlq_count ?? 0}
              tone={(trading.autoexec_dlq_count ?? 0) > 0 ? "warn" : "muted"}
            />
          </StatGrid>
        </Panel>
      </DeskSection>

      <DeskSection label="Services">
        <Card className="gap-0 py-0">
          {buses.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module bus</TableHead>
                  <TableHead className="text-right">WS clients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.map(([name, clients]) => (
                  <TableRow key={name}>
                    <TableCell className="font-mono">{name}</TableCell>
                    <TableCell
                      className={`tabular text-right ${clients ? "text-up" : "text-faint"}`}
                    >
                      {clients}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyDescription>No buses registered.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </Card>
      </DeskSection>

      <DeskSection label="System">
        <Panel>
          <StatGrid columns={4}>
            <Stat label="Uptime" value={duration(data.uptime_sec)} />
            <Stat
              label="Memory (peak RSS)"
              value={`${fmt(metrics.rss_mb, 1)} MB`}
            />
            <Stat label="CPU user" value={`${fmt(metrics.cpu_user_s, 1)}s`} />
            <Stat label="Python" value={metrics.python || "—"} />
          </StatGrid>
        </Panel>
      </DeskSection>

      <DeskSection label="Deploy">
        <Panel>
          <StatGrid columns={4}>
            <Stat label="Commit" value={deploy.commit || "local"} />
            <Stat label="Branch" value={deploy.branch || "—"} />
            <Stat label="Region" value={deploy.region || "—"} />
            <Stat label="Env" value={deploy.env || "—"} />
          </StatGrid>
        </Panel>
      </DeskSection>
    </DeskPage>
  )
}

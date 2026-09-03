import type { Metadata } from "next"
import fixture from "@/data/telegram.json"

import { deskGet, endpoint } from "@/lib/api"
import type { PaperTrade, TelegramState } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  compact,
  Delta,
  DeskPage,
  DeskPageHeader,
  LiveDot,
  RelativeTime,
  Stat,
  StatGrid,
} from "@/components/desk"
import { SourceBadge } from "@/components/desk/source-badge"

export const metadata: Metadata = { title: "Telegram Mini App" }

const telegram = endpoint("/tg/state", fixture as unknown as TelegramState)

function num(v: number | null | undefined, digits = 2) {
  return v == null ? "—" : v.toFixed(digits)
}

function TradeRow({ trade }: { trade: PaperTrade }) {
  const closed = trade.closed_ts != null
  return (
    <Item variant="outline" size="sm">
      <ItemContent>
        <ItemTitle className="flex items-center gap-2 text-[12px]">
          <Badge
            variant={trade.side === "long" ? "ok" : "bad"}
            className="px-1.5"
          >
            {trade.side}
          </Badge>
          {trade.symbol}
          <span className="font-normal text-faint">×{trade.contracts}</span>
          <span className="ml-auto">
            <Delta value={trade.pnl_pct} digits={1} suffix="%" />
          </span>
        </ItemTitle>
        <ItemDescription className="text-[11px]">
          entry {num(trade.entry)}
          {closed
            ? ` → exit ${num(trade.exit)}`
            : ` · now ${num(trade.last)}`}{" "}
          ·{" "}
          <span className={cn((trade.pnl ?? 0) >= 0 ? "text-up" : "text-down")}>
            {(trade.pnl ?? 0) >= 0 ? "+" : ""}${num(trade.pnl, 0)}
          </span>
          {closed && trade.reason ? ` · ${trade.reason}` : ""} ·{" "}
          <RelativeTime ts={trade.closed_ts ?? trade.opened_ts} />
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

export default async function TelegramPage() {
  const { data, live, reason } = await deskGet(telegram)
  const s = data.setup
  const stats = data.trades.stats

  return (
    <DeskPage>
      <DeskPageHeader
        title={
          <>
            Telegram Mini App
            <SourceBadge live={live} reason={reason} capturedAt="2026-09-03" />
          </>
        }
        description="The pocket view NEOS opens from the group chat: the live tape, whatever setup is locked right now, the paper book, and the day's scanner hits. Same data as the desk, sized for one thumb."
        meta={
          <span className="flex items-center gap-1.5">
            <LiveDot live={data.live.connected} />
            {num(data.live.price)} · bid {num(data.live.bid)} / ask{" "}
            {num(data.live.ask)}
          </span>
        }
      />

      {/* The real mini app is a four-tab phone screen; this keeps the tabs so
          the shape matches what NEOS actually sees. */}
      <Tabs defaultValue="live" className="gap-4">
        <TabsList>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="scanners">Scanners</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card className="gap-0 px-4 py-4">
            <StatGrid columns={4}>
              <Stat label="Last" value={num(data.live.price)} />
              <Stat label="Bid" value={num(data.live.bid)} tone="up" />
              <Stat label="Ask" value={num(data.live.ask)} tone="down" />
              <Stat
                label="CVD"
                value={compact(data.live.cvd)}
                tone={(data.live.cvd ?? 0) >= 0 ? "up" : "down"}
              />
              <Stat
                label="Book Δ (L2)"
                value={compact(data.live.lt_diff)}
                tone={(data.live.lt_diff ?? 0) >= 0 ? "up" : "down"}
              />
              <Stat label="Tape time" value={data.live.time ?? "—"} />
            </StatGrid>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <Card className="gap-0 px-4 py-4">
            {s && s.status === "open" ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={s.dir === "long" ? "ok" : "bad"}>
                    {s.dir}
                  </Badge>
                  <span className="font-sans text-[13px] font-semibold">
                    {s.strategy}
                  </span>
                  <span className="text-[11px] text-faint">
                    locked <RelativeTime ts={s.ts} />
                  </span>
                </div>
                <StatGrid columns={4} className="mt-3">
                  <Stat label="Entry" value={num(s.entry)} />
                  <Stat label="T1" value={num(s.t1)} tone="up" />
                  <Stat label="Stop" value={num(s.stop)} tone="down" />
                  <Stat
                    label="Now"
                    value={num(data.live.price)}
                    tone={
                      s.entry != null && data.live.price != null
                        ? (data.live.price - s.entry) *
                            (s.dir === "long" ? 1 : -1) >=
                          0
                          ? "up"
                          : "down"
                        : "muted"
                    }
                  />
                </StatGrid>
              </>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyDescription>No active setup.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="flex flex-col gap-4">
          <Card className="gap-0 px-4 py-4">
            <StatGrid columns={4}>
              <Stat
                label="Day P&L"
                value={`${stats.day_pnl >= 0 ? "+" : ""}$${stats.day_pnl.toFixed(0)}`}
                tone={stats.day_pnl >= 0 ? "up" : "down"}
              />
              <Stat label="Open" value={stats.open_count} />
              <Stat label="Closed" value={stats.closed_count} />
              <Stat
                label="Win rate"
                value={
                  stats.win_rate == null ? "—" : `${stats.win_rate.toFixed(1)}%`
                }
                tone={
                  stats.win_rate == null
                    ? "muted"
                    : stats.win_rate >= 50
                      ? "up"
                      : "down"
                }
              />
            </StatGrid>
          </Card>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] tracking-[0.1em] text-muted-foreground uppercase">
              Open
            </span>
            {data.trades.open.length ? (
              data.trades.open.map((t) => <TradeRow key={t.id} trade={t} />)
            ) : (
              <Card className="gap-0 py-0">
                <Empty className="py-6">
                  <EmptyHeader>
                    <EmptyDescription>Nothing open.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] tracking-[0.1em] text-muted-foreground uppercase">
              Recent closed
            </span>
            {data.trades.closed.map((t) => (
              <TradeRow key={t.id} trade={t} />
            ))}
          </div>
        </TabsContent>

        <TabsContent
          value="scanners"
          className="grid gap-3 md:grid-cols-3 [&>*]:min-w-0"
        >
          {(
            [
              ["Surge", data.scanners.surge],
              ["Squeeze", data.scanners.squeeze],
              ["FDA catalysts", data.scanners.fda],
            ] as const
          ).map(([label, rows]) => (
            <Card key={label} className="gap-0 py-4">
              <CardContent className="flex flex-col gap-2 px-4">
                <span className="text-[12px] tracking-[0.1em] text-muted-foreground uppercase">
                  {label}
                </span>
                {rows.length ? (
                  rows.map((r) => (
                    <div
                      key={r.ticker}
                      className="border-t border-line-soft pt-2"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold">{r.ticker}</span>
                        <span className="tabular ml-auto text-[11px] text-faint">
                          {r.score}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {r.note}
                      </p>
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-faint">No hits.</span>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DeskPage>
  )
}

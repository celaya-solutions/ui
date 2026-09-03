/**
 * Response shapes served by the Python desk. Each block names the handler it
 * mirrors so the two stay traceable when the aiohttp side moves.
 */

/* ── system_status · build_snapshot() ─────────────────────────────────────── */

export type SourceStatus = "live" | "stale" | "idle" | "off"

export type StreamHealth = {
  daemon_running?: boolean
  last_write_age?: number | null
  connected_secs?: number | null
  last_push_age?: number | null
  refresh_token_expired?: boolean | null
}

export type SourceHealth = {
  status?: SourceStatus
  detail?: string
}

export type SystemStatus = {
  ts: number
  uptime_sec: number
  stream: StreamHealth
  schwab: StreamHealth
  sources: { ibkr: SourceHealth; schwab: SourceHealth }
  quantdata: {
    configured?: boolean
    calls?: number
    errors?: number
    last_ok_age?: number | null
    cache?: { entries?: number; fresh?: number; ttl_sec?: number }
    last_error?: {
      at: number
      status?: number | string
      detail?: string
    } | null
  }
  ibkr: {
    connected?: boolean
    daemon_running?: boolean
    account?: string | null
  }
  ibkr_oauth: {
    enabled?: boolean
    session_ok?: boolean
    lst_valid?: boolean
    lst_expires_in?: number | null
  }
  modules: string[]
  buses: Record<string, number>
  scanners: Record<
    "squeeze" | "surge" | "fda",
    { age_sec?: number | null; fresh?: boolean; count?: number }
  >
  trading: {
    setup_locked?: boolean
    setup_dir?: "long" | "short" | null
    setup_age_sec?: number | null
    open_trades?: number
    closed_trades?: number
    autoexec_enabled?: boolean
    autoexec_circuit_open?: boolean
    autoexec_dlq_count?: number
  }
  metrics: { rss_mb?: number; cpu_user_s?: number; python?: string }
  deploy: {
    commit?: string | null
    branch?: string | null
    region?: string | null
    env?: string | null
    domain?: string | null
  }
}

/* ── squeeze_scanner · /squeeze_scanner/ws + /api/scan ────────────────────── */

export type ExitSeverity = "green" | "yellow" | "red"

export type SqueezeRow = {
  ticker: string
  price: number
  change_pct: number
  short_float: number
  dtc: number
  vol_ratio: number
  mktcap?: string | null
  /** Squeeze Pressure Index, 0–100. */
  spi: number
  label: string
  entry?: number | null
  stop?: number | null
  target?: number | null
  rr?: number | null
  /** 1 pre-squeeze · 2 ignition · 3 chase. */
  entry_zone?: 1 | 2 | 3 | null
  entry_rank?: number | null
  exit_top?: { signal: string; severity: ExitSeverity; reason?: string } | null
  pullback_active?: boolean
  pullback_near?: boolean
  pct_from_breakout?: number | null
  breakout_level?: number | null
}

export type SqueezeScan = { ts: number; results: SqueezeRow[] }

/* ── surge_screener · /surge_screener/api/results ─────────────────────────── */

export type SurgeTrackId = "t1" | "t2" | "t3"

export type SurgeOption = {
  kind: "call" | "put"
  strike: number
  expiry: string
  ask: number
  dte: number
}

export type SurgePick = {
  ticker: string
  price: number
  /** Move against yesterday's close, and against today's open. */
  chg_close: number
  chg_open: number
  direction: "up" | "down"
  option?: SurgeOption | null
  tight_stop?: number | null
  riskier_stop?: number | null
  score: number
  active?: boolean
  stopped_out?: boolean
  late?: boolean
  afternoon?: boolean
  alert_time?: string | null
  alert_ask?: number | null
  current_ask?: number | null
  /** Option P&L against the alert ask, roughly 15 minutes delayed. */
  pnl_pct?: number | null
}

export type SurgeScan = {
  ts: string
  date: string
  window: "prime" | "extended" | "afternoon" | "closed"
  counts: Partial<Record<SurgeTrackId | `${SurgeTrackId}_total`, number>>
  t1: SurgePick[]
  t2: SurgePick[]
  t3: SurgePick[]
}

/* ── fda_scanner · /fda_scanner/api/scan ──────────────────────────────────── */

export type CatalystType =
  | "pdufa"
  | "adcom"
  | "trial_readout"
  | "breakthrough"
  | "accelerated"
  | "priority"
  | "nda_bla"
  | "fast_track"
  | "orphan"

export type CatalystMeta = {
  label: string
  score: number
  emoji: string
  desc: string
  full_name: string
  trade_note: string
}

export type FdaRow = {
  ticker: string
  company: string
  /** FDA Catalyst Score, 0–100. */
  fcs: number
  fcs_label: string
  catalyst_types: CatalystType[]
  days_since: number
  file_date: string
  filing_url?: string | null
  price: number
  change_pct: number
  /** Price when the desk first alerted on this filing; null once the ledger resets. */
  first_alert_price?: number | null
  first_alert_ts?: number | null
  change_since_alert_pct?: number | null
  market_cap: number
  mktcap_str?: string | null
  short_float: number
  short_ratio: number
  trade_stage?: string | null
}

export type FdaScan = {
  ts: number
  results: FdaRow[]
  /** Labels and copy come from the server; the client keeps no second copy. */
  catalyst_types: Partial<Record<CatalystType, CatalystMeta>>
}

/* ── timeframe_bias · /timeframe_bias/api/state ───────────────────────────── */

export type BiasDirection = "UP" | "DOWN" | "FLAT"

export type TimeframeFrame = {
  key: string
  label_tf: string
  seconds: number
  /** tanh-squashed trend + momentum, −1…+1. null when nothing was measured. */
  tilt: number | null
  direction: BiasDirection | null
  arrow: string
  label: string
  strength: string | null
  bars: number
  minBars: number
  close: number | null
  live: boolean
  barAgeSec: number | null
  detail: string | null
}

export type BiasAlignment = {
  score: number | null
  label: string
  direction?: BiasDirection | null
  arrow?: string
  up: number
  down: number
  flat: number
  measured: number
  total: number
}

export type TimeframeBiasState = {
  ticker: string
  session: string
  refresh_sec: number
  frames: TimeframeFrame[]
  alignment: BiasAlignment
  /** Age of the *fetch*, not of the tape — a stalled loop and a quiet market
      produce the same arrows, so the panel dims on this rather than guessing. */
  barsAgeSec: number | null
  fetchError: string | null
  tick: { price: number | null; ts: number | null; source: string | null }
  tickAgeSec: number | null
  method: {
    formula: string
    flatBand: number
    minBars: number
    barSource: string
  }
  generatedAt: number
}

/* ── quant_flow · /quant_flow/api/state ───────────────────────────────────── */

export type LayerError = { error: string; status?: number | null }

/** Layer 1 — price and depth, straight from the in-process IBKR stream. */
export type QuantLayerOne = {
  symbol: string
  price: number | null
  bid: number | null
  ask: number | null
  /** build_ladder() emits [price, size] pairs, not objects. */
  ladder: { bids: [number, number][]; asks: [number, number][] }
  sources: {
    ibkr: { connected: boolean; armed: boolean; last_write_age: number | null }
    schwab: { connected?: boolean; armed?: boolean; detail?: string | null }
  }
  venueNotice: string
}

export type FlowRow = {
  neosGrade: string
  neosGradeScore?: number
  contractType: "CALL" | "PUT"
  expirationDate: string
  strikePrice: number
  premium: number
  size: number
  volume: number
  openInterest: number
  tradeSideCode: string
  direction: "BULLISH" | "BEARISH" | "NEUTRAL"
  isGoldenSweep?: boolean
  tradeConsolidationType?: string
  isUnusual?: boolean
  isOpeningPosition?: boolean
  isVolumeGreaterThanOpenInterest?: boolean
}

export type FlowBias = {
  /** −1…+1. null, never 0.5, when there is no directional premium at all. */
  tilt: number | null
  label: string
  bullishPremium: number
  bearishPremium: number
  callPremium: number
  putPremium: number
  callShare: number | null
  sampleSize: number
}

export type QuantLayerTwo = {
  data: FlowRow[]
  bullishPremium: number
  bearishPremium: number
  bullishShare: number | null
  bias: FlowBias
  gradeNotice: string
}

export type GexStrike = { strike: number; netGammaExposure: number }

export type QuantLayerThree = {
  stockPrice: number | null
  topPositive: GexStrike[]
  topNegative: GexStrike[]
  topAbsolute: GexStrike[]
}

export type DarkLevel = {
  price: number
  notionalValue: number
  size?: number
  volume?: number
}

export type QuantLayerFour = {
  levels:
    | { latestStockPrice: number | null; topLevels: DarkLevel[] }
    | LayerError
  intradayFlow: Record<string, unknown> | LayerError
}

export type QuantFlowState = {
  ticker: string
  generatedAt: number
  session: string
  configured: boolean
  refresh_sec: number
  cache: { entries?: number; fresh?: number; ttl_sec?: number }
  layers: {
    "1_price_l2": QuantLayerOne
    "2_options_flow": QuantLayerTwo | LayerError
    "3_gamma_exposure_by_strike": QuantLayerThree | LayerError
    "4_dark_pool": QuantLayerFour
  }
  cautions: string[]
}

export function isLayerError<T>(layer: T | LayerError): layer is LayerError {
  return !!layer && typeof layer === "object" && "error" in layer
}

/* ── setup_tracker · /setup_tracker/api/state ─────────────────────────────── */

export type SetupResolution = {
  win: boolean | null
  outcome: string
  r?: number | null
  age_sec?: number | null
  /** Hit a level while the feed was down — excluded, not counted as a loss. */
  ambiguous?: boolean
  detail?: string | null
}

export type Setup = {
  id: string
  strategy: string
  dir: "long" | "short"
  symbol?: string
  entry: number
  t1: number
  stop: number
  r_target?: number | null
  status: "open" | "closed" | "expired" | "unverified"
  created_ts: number
  last_price?: number | null
  mfe?: number | null
  mae?: number | null
  targets_hit?: string[]
  resolution?: SetupResolution | null
  context?: { flow_tilt?: number | null } | null
  gate?: {
    armed?: boolean
    trade_id?: string | null
    would_fire?: boolean
    reason?: string | null
  } | null
}

export type CohortScore = {
  key: string
  total: number
  decided: number
  wins: number
  losses: number
  /** null, never 0, on an empty cohort — 0% claims every setup lost. */
  win_rate: number | null
  expectancy_r: number | null
  ran_to_t2: number
  avg_mfe: number | null
  sample_ok: boolean
}

export type OverallScore = CohortScore & {
  open: number
  expired: number
  unverified: number
  ambiguous: number
  avg_r_target: number | null
  avg_mae: number | null
  avg_hold_sec: number | null
  ran_to_t3: number
  min_sample: number
  rule: string
}

export type SetupGroupField =
  | "strategy"
  | "dir"
  | "source"
  | "symbol"
  | "session"
  | "flow_bucket"
  | "conf_bucket"

export type SetupTrackerState = {
  configured: boolean
  armed: boolean
  rule: string
  feed: {
    connected: boolean
    price: number | null
    last_tick_age: number | null
  }
  open: Setup[]
  recent: Setup[]
  scoreboard: {
    rule: string
    overall: OverallScore
    by: Partial<Record<SetupGroupField, CohortScore[]>>
  }
  window_days: number | null
  cautions: string[]
}

/* ── spy_liquidity_flow · /spy_liquidity_flow/api/state ───────────────────── */

export type LiquidityPool = {
  price: number
  volume: number
  /** volume / max volume across the profile, 0–1. */
  thickness: number
}

export type OrderBlock = { low: number; high: number; index: number }

export type LiquidityFlowState = {
  symbol: string
  price: number | null
  bid: number | null
  ask: number | null
  pools: LiquidityPool[]
  order_blocks: { bullish: OrderBlock[]; bearish: OrderBlock[] }
  volume_arrow: {
    direction: "up" | "down" | "flat"
    magnitude: number
    up_volume: number
    down_volume: number
  }
  price_target: LiquidityPool | null
  candle_count: number
  ts: number
  error?: string
}

/* ── bank_rule_tunnel · /bank_rule_tunnel/api ─────────────────────────────── */

export type TunnelCandle = {
  time: string
  open: number
  high: number
  low: number
  close: number
  cvd: number
  lt_ask: number
  lt_bid: number
  lt_diff: number
}

export type SwingPoint = { index: number; price: number; time: string }
export type Sweep = {
  index: number
  dir: "up" | "down"
  price: number
  time: string
}
export type Fvg = {
  index: number
  dir: "bull" | "bear"
  top: number
  bot: number
  time: string
}
export type TunnelOrderBlock = Fvg

export type BankRuleTunnelState = {
  live: {
    price?: number | null
    cvd?: number | null
    lt_bid?: number | null
    lt_ask?: number | null
    lt_diff?: number | null
    time?: string
  }
  candles: TunnelCandle[]
  swing_highs: SwingPoint[]
  swing_lows: SwingPoint[]
  sweeps: Sweep[]
  fvgs: Fvg[]
  obs: TunnelOrderBlock[]
  /** Nearest untaken liquidity either side of price. */
  tunnel: { top: number | null; bot: number | null }
  bias: "BULLISH" | "BEARISH" | "NEUTRAL"
  ts: number
}

/* ── spy_heatmap · /spy_heatmap/api/state ─────────────────────────────────── */

export type HeatmapColumn = {
  t: number
  time?: string
  price: number | null
  bid: number | null
  ask: number | null
  cvd: number | null
  /** [price, size] pairs, deepest last. */
  bids: [number, number][]
  asks: [number, number][]
}

export type HeatmapControls = { window_sec: number; gamma: number }

export type HeatmapVenue = {
  source: string
  venue: string
  depth: number
  stream: {
    connected?: boolean
    armed?: boolean
    last_write_age?: number | null
    detail?: string
  }
  controls: HeatmapControls
  columns: HeatmapColumn[]
}

export type HeatmapState = {
  source: string
  depth: number
  stream: HeatmapVenue["stream"]
  columns: HeatmapColumn[]
  symbol: string
  column_sec: number
  max_columns: number
  session: string
  window_choices: number[]
  gamma_range: [number, number]
  venue_order: string[]
  venues: Record<string, HeatmapVenue>
}

/* ── trading_calendar · static, shipped with the view ─────────────────────── */

export type CalendarEventType =
  | "holiday"
  | "halfday"
  | "fomc"
  | "fomc-week"
  | "witching"
  | "opex"
  | "weekly"
  | "futures"
  | "earnings"
  | "econ"
  | "political"
  | "seasonal"
  | "cultural"

export type CalendarEvent = {
  type: CalendarEventType
  label: string
  detail: string
}

/** Keyed by ISO date. Extracted from the Python view's own event database. */
export type TradingCalendar = Record<string, CalendarEvent[]>

/* ── qqq_strategy · /qqq_strategy/api/data ────────────────────────────────── */

export type CamarillaPivots = Record<
  "H4" | "H3" | "H2" | "H1" | "L1" | "L2" | "L3" | "L4",
  number
>

export type QqqFvg = {
  type: "bullish" | "bearish"
  top: number
  bottom: number
  mid: number
  time: string
  size: number
}

export type LiquidityPoolLevel = {
  level: number
  /** Buy-side liquidity sits above price; sell-side below. */
  type: "BSL" | "SSL"
  label: string
  strength: number
  swept: boolean
}

export type DayType = {
  type: "BREAKOUT" | "TREND_POSSIBLE" | "REVERSION"
  label: string
  color: string
  desc: string
  bias: "LONG" | "SHORT" | "NEUTRAL" | "FADE"
}

export type BrooksSetup = {
  direction: "LONG" | "SHORT"
  entry: number
  stop: number
  target: number
  risk: number
  rr: number
  time: string
  bar_idx: number
  confluence: number
  strength: "HIGH" | "MODERATE"
}

export type StrategySignal = {
  type: "ENTRY" | "EXIT"
  direction: "LONG" | "SHORT"
  priority: number
  signal: string
  entry?: number
  stop?: number
  target?: number
  reason: string
}

export type QqqStrategyState = {
  symbol: string
  price: number
  open: number
  high: number
  low: number
  change_pct: number
  pivots: CamarillaPivots
  yesterday: { high: number; low: number; close: number }
  fvgs: QqqFvg[]
  pools: LiquidityPoolLevel[]
  day_type: DayType
  setups: BrooksSetup[]
  signals: StrategySignal[]
  candles: {
    time: string
    open: number
    high: number
    low: number
    close: number
  }[]
  ts: number
  updated: string
}

/* ── telegram_app · /tg/ws ────────────────────────────────────────────────── */

export type PaperTrade = {
  id: string
  symbol: string
  side: "long" | "short"
  contracts: number
  entry: number
  last?: number | null
  exit?: number | null
  pnl?: number | null
  pnl_pct?: number | null
  opened_ts: number
  closed_ts?: number | null
  reason?: string | null
}

export type TelegramState = {
  live: {
    price: number | null
    bid: number | null
    ask: number | null
    cvd: number | null
    lt_diff: number | null
    time?: string
    connected: boolean
  }
  setup: {
    status: "open" | "none"
    dir?: "long" | "short"
    entry?: number
    t1?: number
    stop?: number
    strategy?: string
    ts?: number
  } | null
  trades: {
    open: PaperTrade[]
    closed: PaperTrade[]
    stats: {
      day_pnl: number
      open_count: number
      closed_count: number
      win_rate: number | null
    }
  }
  scanners: {
    surge: { ticker: string; note: string; score: number }[]
    squeeze: { ticker: string; note: string; score: number }[]
    fda: { ticker: string; note: string; score: number }[]
  }
  ts: number
}

/* ── schwab_auth · /schwab_auth/api/status ────────────────────────────────── */

export type SchwabAuthStatus = {
  credentials_configured: boolean
  have_tokens: boolean
  redirect_uri: string
  mode: "auto" | "paste"
  callback_path: string
  refresh_age_sec: number | null
  refresh_expires_in_sec: number | null
  refresh_expired: boolean
  ttl_sec: number
  stream: {
    connected?: boolean
    armed?: boolean
    last_write_age?: number | null
    detail?: string
  }
  last_result: { ok?: boolean; message?: string; ts?: number } | null
  server_time: number
}

/* ── spx_dash · /spx_dash/api/state ───────────────────────────────────────── */

export type ObDirection = "UP" | "DOWN" | "FLAT" | null

export type SpxTick = {
  time: string
  price: number
  lt_bid: number | null
  lt_ask: number | null
  lt_diff: number | null
  cvd: number | null
  imbalance: number | null
  /** Standard deviation of imbalance over the 30-tick window, as a percent. */
  book_sd: number | null
  book_score: number
  cvd_score: number
  mom_score: number
  ob_score: number
  trend_score: number
  /** Sum of the five, −7…+7. */
  total_score: number
  ob_dir: ObDirection
  cvd_delta: number | null
  trend_delta: number | null
  confidence: number
  atr: number | null
  trade_dir: "LONG" | "SHORT" | null
  entry: number | null
  sl: number | null
  t1: number | null
  t2: number | null
  t3: number | null
  tradeable: boolean
  gate_reason: string | null
  session: string
}

export type SpxQuote = {
  price: number | null
  change: number | null
  change_pct: number | null
  fetched: number | null
  symbol: string | null
  error: string | null
}

export type SpxDashState = {
  history: SpxTick[]
  tick: SpxTick | null
  spx: SpxQuote
  /** One staleness verdict, taken from the stream's own health. */
  stale: boolean
  health: {
    connected?: boolean
    armed?: boolean
    last_write_age?: number | null
    detail?: string
  }
  tradeable: boolean
  gate_reason: string | null
  session: string
  served_at: number
}

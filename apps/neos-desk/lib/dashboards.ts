import {
  Activity,
  BadgeCheck,
  CalendarDays,
  Compass,
  FlaskConical,
  Gauge,
  Grid2x2,
  HeartPulse,
  Layers,
  LineChart,
  Send,
  Target,
  TrendingUp,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react"

export type DashboardGroup = "Live" | "Scanners" | "Reference"

export type Dashboard = {
  /** Module name in the Python app — the `dashboards/<name>.py` stem. */
  name: string
  /** Route in this app. */
  href: string
  label: string
  group: DashboardGroup
  icon: LucideIcon
  /** One line for the overview grid and page subheads. */
  blurb: string
  /** Whether the source dashboard consumes a live feed. */
  live?: boolean
}

/**
 * Mirrors `_DASHBOARDS_ALL` in the Python app's `app.py`, minus the four
 * `spy_bookmap_*_ibkr` variants — those stay in the aiohttp app, where the
 * canvas L2/CVD renderer lives.
 */
export const dashboards: Dashboard[] = [
  {
    name: "spy_liquidity_flow",
    href: "/spy-liquidity-flow",
    label: "SPY Liquidity & Flow",
    group: "Live",
    icon: Waves,
    blurb:
      "Resting size either side of the inside market, and where it is going.",
    live: true,
  },
  {
    name: "spy_heatmap",
    href: "/spy-heatmap",
    label: "SPY Depth Heatmap",
    group: "Live",
    icon: Grid2x2,
    blurb: "Per-price resting depth painted over time.",
    live: true,
  },
  {
    name: "bank_rule_tunnel",
    href: "/bank-rule-tunnel",
    label: "Bank Rule Tunnel",
    group: "Live",
    icon: Layers,
    blurb:
      "ICT/SMC structure — premium/discount, order blocks, liquidity pools.",
    live: true,
  },
  {
    name: "qqq_strategy",
    href: "/qqq-strategy",
    label: "QQQ Strategy",
    group: "Live",
    icon: TrendingUp,
    blurb: "Camarilla pivots, fair-value gaps and Al Brooks second entries.",
  },
  {
    name: "quant_flow",
    href: "/quant-flow",
    label: "Quant Flow",
    group: "Live",
    icon: Activity,
    blurb: "Four-layer pre-trade read: depth, options flow, gamma, dark pools.",
    live: true,
  },
  {
    name: "setup_tracker",
    href: "/setup-tracker",
    label: "Setup Win Rate",
    group: "Live",
    icon: Target,
    blurb: "Every setup the desk called, scored against what price did next.",
    live: true,
  },
  {
    name: "timeframe_bias",
    href: "/timeframe-bias",
    label: "Timeframe Bias",
    group: "Live",
    icon: Compass,
    blurb: "Direction across five timeframes, and whether they agree.",
    live: true,
  },
  {
    name: "spx_dash",
    href: "/spx-dash",
    label: "SPX Dash",
    group: "Live",
    icon: Gauge,
    blurb: "Five signals off the Schwab book, summed, with ATR-sized levels.",
    live: true,
  },
  {
    name: "squeeze_scanner",
    href: "/squeeze-scanner",
    label: "Squeeze Scanner",
    group: "Scanners",
    icon: Zap,
    blurb:
      "Mechanical short-squeeze pressure index across the float-tight names.",
  },
  {
    name: "surge_screener",
    href: "/surge-screener",
    label: "Surge Screener",
    group: "Scanners",
    icon: LineChart,
    blurb: "Three tracks of gap and breakout alerts.",
  },
  {
    name: "fda_scanner",
    href: "/fda-scanner",
    label: "FDA Catalysts",
    group: "Scanners",
    icon: FlaskConical,
    blurb: "Biotech catalysts read out of EDGAR 8-K filings.",
  },
  {
    name: "trading_calendar",
    href: "/trading-calendar",
    label: "Trading Calendar",
    group: "Reference",
    icon: CalendarDays,
    blurb: "NYSE sessions, holidays and early closes.",
  },
  {
    name: "system_status",
    href: "/system-status",
    label: "System Status",
    group: "Reference",
    icon: HeartPulse,
    blurb: "Feed, scanner and broker health. Check here first.",
    live: true,
  },
  {
    name: "telegram_app",
    href: "/telegram",
    label: "Telegram Mini App",
    group: "Reference",
    icon: Send,
    blurb: "The pocket view — open trades and the day's scanner hits.",
  },
  {
    name: "schwab_auth",
    href: "/schwab-auth",
    label: "Schwab Connect",
    group: "Reference",
    icon: BadgeCheck,
    blurb: "One-click re-auth. Schwab tokens expire every seven days.",
  },
]

export const dashboardGroups: DashboardGroup[] = [
  "Live",
  "Scanners",
  "Reference",
]

export function dashboardByHref(href: string) {
  return dashboards.find((d) => d.href === href)
}

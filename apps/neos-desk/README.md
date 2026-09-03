# neos-desk

The [NEO trading desk](https://github.com/rhguatahub/neos-trading-desk) rebuilt
on the shadcn/ui registry.

The source of truth is the Python app: one aiohttp service that serves a
complete, self-contained HTML document per dashboard out of `web/views/`, each
carrying its own `<style>` block and vanilla-JS fetch/WebSocket loop, loaded
into an iframe by `web/shell.html`. This app is the same dashboards rendered as
React against the same endpoints.

```bash
pnpm dev        # → http://localhost:4100
```

## Data

Every page reads through `lib/api.ts`:

```ts
const systemStatus = endpoint("/system_status/api/status", fixture)
const { data, live, reason } = await deskGet(systemStatus)
```

With `NEXT_PUBLIC_NEOS_BASE_URL` unset — the default — `deskGet` returns the
committed fixture from `data/` and the whole desk renders standalone. Point it
at the running Python app and every page goes live with no other change:

```bash
NEXT_PUBLIC_NEOS_BASE_URL=http://localhost:8800 pnpm dev
```

The fixture stays the failure mode: if the desk is up but one endpoint faults,
that page falls back rather than blanking — the same thing the Python app's own
demo mode does. Every page says which it is showing, via `SourceBadge`.

Fixtures are captured shapes, not invented ones. The FDA catalyst dictionary and
the whole 2026 trading calendar are extracted from the Python source at build
time rather than retyped, so they cannot drift.

They also have to be _plausible_, not just well-shaped. SPX Dash reads the book
imbalance's 30-tick standard deviation against bands at 0.15% and 0.30%, so a
fixture that resampled bid and ask independently each tick produced a 26% SD and
pegged the meter. Its book is generated as a mean-reverting series instead. Note
that the same page's `BOOK_STRONG` +-2 threshold is a _15% imbalance_ — a
dislocation, not drift — so it does not fire in a calm book, and the Book signal
correctly reads +-1/0.

## Layout

```
app/<dashboard>/       one route per dashboards/<name>.py, minus the bookmaps
components/ui/         the shadcn registry, copied in verbatim
components/desk/       what the registry has no primitive for (see below)
lib/api.ts             endpoint descriptors + fixture fallback
lib/types.ts           response shapes, each block naming its Python handler
data/                  committed endpoint captures
```

### Desk components

The registry covers most of it. These are the pieces it has no primitive for:

| Component                       | Why                                                                        |
| ------------------------------- | -------------------------------------------------------------------------- |
| `Stat` / `StatGrid`             | the `kv()` label-over-value tile every view hand-rolled                    |
| `Delta` / `Meter` / `LiveDot`   | signed values that carry their own colour, fill bars, the liveness pip     |
| `TiltBar` / `TiltArrow`         | centre-anchored diverging gauge for bias, with the ±0.15 flat band         |
| `CandleChart`                   | Recharts has no candle mark, and the structure overlays are price _ranges_ |
| `DepthHeatmap`                  | 150 columns × 20 levels repainting — canvas, not 3,000 DOM nodes           |
| `RelativeTime` / `RelativeDays` | these pages prerender, so ages must be measured on the viewer's clock      |
| `SourceBadge`                   | says out loud whether you are reading the desk or a snapshot               |

`Badge` gains `ok` / `bad` / `stale` / `info` / `special` variants — the
`.chip.ok/.bad/.stale` rule from the views.

## Theme

`app/globals.css` is the Python app's `web/theme.css` expressed as shadcn
tokens: same colours, converted hex → oklch. It is a dark-only surface, so
`:root` and `.dark` carry the same values and `<html>` is fixed to `dark`.

One split the original did not need: `--up/--down/--warn/--info/--special` stay
the bright NEO accents, because their job is _status text_ on near-black.
`--chart-1..5` are the same five hues stepped down into the dark-mode chart band
(OKLCH L 0.48–0.67), because as _area fills_ the bright versions glow and stop
separating. That set is validated for lightness band, chroma floor, CVD
separation and contrast; tritan separation sits in the floor band, so every
multi-series chart also carries a legend or direct labels.

## Not here

The four `spy_bookmap_*_ibkr` variants stay in the Python app — roughly 12k
lines of hand-rolled canvas L2/CVD rendering, which React would carry verbatim
without gaining anything.

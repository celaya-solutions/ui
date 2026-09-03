# neos-desk — notes for the next session

Read `README.md` first for what this app _is_. This file is what a future
session needs to avoid re-learning things the hard way.

## Where things live

- **Source of truth** is the Python/aiohttp app at `~/Documents/neos-trading-desk`.
  Not `~/orca/neos-trading-desk` — that path does not exist, despite being an
  easy thing to be told.
- **This app** is `apps/neos-desk` in the shadcn/ui monorepo clone at `~/orca/ui`.
- **A second copy of this app** is committed inside the Python repo, also at
  `apps/neos-desk`. Another session put it there deliberately ("Preserve the
  React/shadcn desk rebuild in-repo"). They were re-synced byte-for-byte on
  2026-09-03. **They will drift again.** Either keep them in step on purpose or
  delete one; do not assume the one you are looking at is current.

## Remotes — read before pushing

`origin` is **`shadcn-ui/ui`**, the real upstream. It is there so upstream
registry updates can be fetched. **Never push to it.**

Work goes to `personal` → `celaya-solutions/ui`. Branches `main` and
`neos-trading-desk-v2` both carry this work.

The Python repo's remote is `rhguatahub/neos-trading-desk` — not a personal
repo, though the account does have push. It uses topic branches; push there
accordingly.

## Running it

```bash
pnpm dev        # → http://localhost:4100
```

Fixtures by default. `NEXT_PUBLIC_NEOS_BASE_URL=http://localhost:8800` switches
every page to the live desk with no code change; the badge in each page header
flips from Snapshot to Live.

The Python side is `./run.sh` (never a bare `python app.py`) and needs its port
freed by PID first — see that repo's CLAUDE.md, which is detailed and correct.

## What is unfinished

Ordered by how much it would hurt to keep ignoring.

1. **No page has ever run against the live backend.** Every contract in
   `lib/types.ts` was read off the Python source and matched by hand-built
   fixtures. A field the app actually names differently, or returns `null` more
   often than assumed, would look perfect until the env var is set. Booting the
   Python app once and pointing this at it validates all 16 contracts in a
   single pass. **This is the cheapest high-value next step.**
2. **The whole port is read-only.** The three scanners each expose an
   `/api/scan` endpoint that nothing here calls; there is no paper-trade
   confirm; `app/login/page.tsx` posts to `/login`, which has no handler.
3. **No WebSocket wiring.** Three source views stream rather than poll.
   `deskSocketUrl()` in `lib/api.ts` is exported and never called — wire it or
   delete it, but it should not stay as it is.
4. **No tests.**
5. **The four `spy_bookmap_*_ibkr` views are not ported.** Deliberate. Note the
   finding if it is ever revisited: they are _not_ four dashboards. All four
   Python modules are thin wrappers over one shared `bookmap_ibkr.py`, and the
   four HTML views share ~2,780 of ~2,900 lines — copy-paste forks differing by
   a paper panel (#2), a today-stats block (#4), and `record_stats=True` (#1).
   The port is one component with feature flags, not four pages.

## Gotchas already paid for

- **The NEO accents are status colours, not series colours.** The `--up`,
  `--down`, `--warn`, `--info` and `--special` tokens are the bright originals,
  correct as text on near-black. As chart _fills_ they sit at OKLCH L 0.69–0.82, above the
  dark-mode band, and adjacent series stop separating. `--chart-1..5` are the
  same five hues stepped to L 0.48–0.67 and validated. Do not paint a series
  with a status token.
- **Grid children need `[&>*]:min-w-0`.** The registry's `Table` already scrolls
  itself; the bug that looks like a clipped table is a grid item defaulting to
  `min-width:auto`, stretching its column so the _page_ scrolls sideways.
- **`Date.now()` during a server render freezes at build time.** These routes
  all prerender. Relative ages go through `RelativeTime` / `RelativeDays`,
  which are client components. ESLint's `react-hooks/purity` catches this — it
  reads as a style rule but it is a correctness one here.
- **Fixtures must be plausible, not merely well-shaped.** SPX Dash reads a
  30-tick standard deviation against bands at 0.15% and 0.30%; independently
  resampled bid/ask gave 26% and pegged the meter. Real book imbalance is
  autocorrelated. Related: that page's `BOOK_STRONG` ±2 threshold is a _15%_
  imbalance — a dislocation, not drift — so it correctly never fires in a calm
  book.
- **`next-env.d.ts` is gitignored** because Next rewrites it every build and its
  output fails the repo's Prettier config. `apps/v4` does the same.
- **The `components/ui` folder is the registry copied in verbatim**, kept
  byte-identical so upstream can be merged rather than re-applied. The
  `react-hooks/purity` exception in `eslint.config.mjs` is scoped to that
  folder for this reason — do not widen it, and do not edit those files to fix
  lint.
- The app has its own `prettier.config.mjs` only because the root config points
  the Tailwind plugin at `apps/v4`'s stylesheet, which needs a workspace package
  built first.

## Conventions worth keeping

Every page states its provenance (`SourceBadge`) rather than silently showing
stale numbers. Null and zero are held apart everywhere — an em-dash means "not
measured", `0` means "measured zero", and `locked` means "deliberately
withheld". Most of the comments in this app exist to protect that distinction,
because it is the one the Python source cares most about.

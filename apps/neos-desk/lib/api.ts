/**
 * The desk's data layer.
 *
 * Every dashboard reads through `deskGet`, which resolves an endpoint
 * descriptor: the path the Python app serves it on, and a committed fixture
 * captured from that path. With `NEXT_PUBLIC_NEOS_BASE_URL` unset — the
 * default — the fixture is returned and the whole desk renders standalone.
 * Set it to `http://localhost:8800` (or the Railway domain) and every
 * dashboard is live against the aiohttp app, with no other change.
 *
 * The fixture also stays the failure mode: if the desk is up but a single
 * endpoint faults, that dashboard falls back rather than blanking the page —
 * which is what the Python app's own demo mode does.
 */

export const DESK_BASE_URL = process.env.NEXT_PUBLIC_NEOS_BASE_URL ?? ""

export type Endpoint<T> = {
  /** Path on the aiohttp app, e.g. `/system_status/api/status`. */
  path: string
  /** Snapshot of a real response, committed under `data/`. */
  fixture: T
}

export function endpoint<T>(path: string, fixture: T): Endpoint<T> {
  return { path, fixture }
}

export type DeskResult<T> = {
  data: T
  /** false when the fixture was served — surfaced in the UI, never hidden. */
  live: boolean
  /** Why the live read did not happen, when it did not. */
  reason?: string
}

export async function deskGet<T>(ep: Endpoint<T>): Promise<DeskResult<T>> {
  if (!DESK_BASE_URL) {
    return { data: ep.fixture, live: false, reason: "no desk configured" }
  }

  try {
    const res = await fetch(`${DESK_BASE_URL}${ep.path}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    })
    if (!res.ok) {
      return {
        data: ep.fixture,
        live: false,
        reason: `desk returned ${res.status}`,
      }
    }
    return { data: (await res.json()) as T, live: true }
  } catch (error) {
    return {
      data: ep.fixture,
      live: false,
      reason: error instanceof Error ? error.message : "desk unreachable",
    }
  }
}

/** WebSocket URL for the three views the Python app streams rather than polls. */
export function deskSocketUrl(path: string) {
  if (!DESK_BASE_URL) return null
  return DESK_BASE_URL.replace(/^http/, "ws") + path
}

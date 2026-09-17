import type { HttpClient, JsonObject } from './_shared.js';

/**
 * How a connected marketplace account is doing.
 *
 * `unknown` is a first-class value, not a placeholder. No sync has been seen,
 * no jar is stored, or the stored jar could not be read — none of which are
 * evidence of a problem. Treat it as "not measured", never as a failure.
 */
export type ConnectionHealthState =
  | 'unknown'
  | 'unmonitored'
  | 'disconnected'
  | 'healthy'
  | 'stale'
  | 'partial_blank'
  | 'blank_credential'
  | 'signed_out'
  | 'anchor_drift'
  | 'no_cookies';

/**
 * Who a diagnosis is FOR.
 *
 * `crossly` means the finding is about our own coverage — a platform renamed a
 * cookie and our expectations have not caught up. Showing it to a seller as
 * something they must fix sends them to do work that cannot help.
 */
export type ConnectionHealthAudience = 'seller' | 'crossly' | 'nobody';

export interface ConnectionHealth {
  platform: string;
  accountSlot: number;
  state: ConnectionHealthState;
  severity: string;
  audience: ConnectionHealthAudience;
  /** One sentence on what is wrong. Written server-side so every client agrees. */
  summary: string;
  /** What to do about it. Already specific — render it, do not paraphrase it. */
  action: string;
  lastBrowserPushAt: string | null;
}

export interface PairedDevice {
  id: string;
  name: string;
  os: string | null;
  version: string | null;
  /**
   * What this machine declared at pairing: `print`, `scan_watch`,
   * `scan_direct`, `browser`, `cookie_jar`, `proxy_bind`, `scale`.
   *
   * `scale` is only ever declared when a scale actually answered — never
   * speculatively — so its presence means a weight can really be read.
   */
  capabilities: string[];
  /**
   * Last contact. A timestamp rather than an `online` boolean on purpose:
   * a dashboard and a script queueing work disagree about how fresh is fresh
   * enough, so the threshold is the caller's to pick.
   */
  lastSeenAt: string | null;
  createdAt: string | null;
}

// ─── Connection health + paired machines ────────────────────────────────────

export class DevicesResource {
  constructor(private http: HttpClient) {}

  /**
   * Health of each connected marketplace account. Envelope: `{ data }` — the canonical /v1 collection shape.
   *
   * One entry per ACCOUNT, not per platform — a healthy slot 1 does not speak
   * for a dead slot 2.
   */
  health(params: { includeUnconnected?: boolean } = {}) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/connection-health',
      query: params,
    });
  }

  /** Machines paired to this account. Envelope: `{ data }` — the canonical /v1 collection shape. */
  list() {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/devices',
    });
  }
}

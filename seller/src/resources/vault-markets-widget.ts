import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Vault Markets home-screen widget ──────────────────────────────────────
//
// `client.vaultMarkets.homeWidget`. The small, cached summary a phone home-screen
// widget shows (portfolio value at the mark and its move, the top three
// movers among what you hold, one watchlist key), and the widget tokens: one
// per phone, each able to read that summary and nothing else. Every price is
// from the Crossly order book and carries its mark quality.

export type VaultWidgetMarkQuality = 'A' | 'B' | 'C' | 'none';

export interface VaultWidgetMover {
  bookKey: string;
  name: string | null;
  label: string | null;
  markCents: number | null;
  markQuality: VaultWidgetMarkQuality;
  change24hBps: number | null;
  /** Units you hold of it; 0 on the market board. */
  units: number;
  /** The buyer app screen for it. */
  appPath: string;
  webUrl: string;
}

export interface VaultWidgetWatch {
  bookKey: string;
  name: string | null;
  label: string | null;
  markCents: number | null;
  markQuality: VaultWidgetMarkQuality;
  change24hBps: number | null;
  change7dBps: number | null;
  /** The last 14 daily marks, oldest first, in cents. */
  sparkline: number[];
  /** False when the requested key is not on your watchlist and the newest watch stands in. */
  chosen: boolean;
  appPath: string;
  webUrl: string;
}

export interface VaultWidgetSummary {
  asOf: string;
  portfolio: {
    valueCents: number;
    costCents: number;
    pnlCents: number;
    units: number;
    unitsOnLoan: number;
    change24hCents: number | null;
    change24hBps: number | null;
    /** Share of the value on reliable (A/B) marks, in bps. */
    reliableShareBps: number | null;
  };
  movers: { source: 'holdings' | 'market'; items: VaultWidgetMover[] };
  watch: VaultWidgetWatch | null;
  watchCount: number;
  refreshAfterSeconds: number;
  source: string;
  links: { appPath: string; webUrl: string };
}

export interface VaultWidgetToken {
  id: string;
  name: string;
  prefix: string;
  createdAt: string | null;
  lastUsedAt: string | null;
}

export interface VaultWidgetTokenList { data: VaultWidgetToken[] }

export interface VaultWidgetTokenMinted extends VaultWidgetToken {
  /** Shown once. */
  token: string;
  scope: string;
  /** Earlier tokens on the same phone this one replaced. */
  replaced: number;
}

export interface VaultWidgetTokenMintInput {
  /** What the phone is called, e.g. "iPhone 15". */
  deviceName: string;
  /** A stable random id per app install (6 to 64 letters, digits or dashes). */
  installId: string;
}

export interface VaultWidgetTokenRevoked { id: string; revoked: true }

export interface VaultWidgetTokensRevoked { revoked: number }

export class VaultMarketsWidgetResource {
  constructor(private http: HttpClient) {}

  /** The widget summary; `key` picks the watchlist key it shows (else your newest watch). */
  summary(key?: string) {
    return this.http.request<VaultWidgetSummary>({ method: 'GET', path: '/v1/vault-markets/widget/summary', query: key ? { key } : undefined });
  }

  /** Your live widget tokens, one per phone. */
  tokens() {
    return this.http.request<VaultWidgetTokenList>({ method: 'GET', path: '/v1/vault-markets/widget/tokens' });
  }

  /** Mint a widget token for one phone; the same deviceName and installId replace that phone's earlier token. */
  mintToken(input: VaultWidgetTokenMintInput, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultWidgetTokenMinted>({ method: 'POST', path: '/v1/vault-markets/widget/tokens', body: input, idempotencyKey: opts.idempotencyKey });
  }

  /** Turn the widget off on one phone. */
  revokeToken(id: string, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultWidgetTokenRevoked>({ method: 'DELETE', path: `/v1/vault-markets/widget/tokens/${encodeURIComponent(id)}`, idempotencyKey: opts.idempotencyKey });
  }

  /** Turn the widget off on every phone. */
  revokeAllTokens(opts: IdempotencyOpts = {}) {
    return this.http.request<VaultWidgetTokensRevoked>({ method: 'DELETE', path: '/v1/vault-markets/widget/tokens', idempotencyKey: opts.idempotencyKey });
  }
}

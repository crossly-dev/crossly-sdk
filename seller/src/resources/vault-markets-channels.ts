import type { HttpClient, IdempotencyOpts, JsonObject } from './_shared.js';

// ─── Vault Markets channels ─────────────────────────────────────────────────
//
// `client.vaultMarkets.channels`. The Telegram and nudge-cap switches, the
// weekly vault digest, a catalogue item's vault value (scan → vault), a
// collection valued at the order book's display marks, and ship-in deposits.
// Every price is a display mark with its quality ('A' | 'B' | 'C' | 'none');
// `cents: null` means no market yet — never a guess. Money is integer CENTS.

export type VaultMarkQuality = 'A' | 'B' | 'C' | 'none';

export interface VaultDisplayMark {
  cents: number | null;
  quality: VaultMarkQuality;
  confidenceBps: number | null;
  asOf: string | null;
}

export interface VaultChannels {
  telegramAlerts: boolean;
  telegramDigest: boolean;
  /** Vault nudges (price alerts, offers, first marks, the digest) by push per day, 0..20. Account notices are never capped. */
  pushCapPerDay: number;
  telegramLinked: boolean;
  nudgesToday: { push: number; telegram: number };
}

export interface VaultValueKey {
  bookKey: string;
  variantId: string;
  variantLabel: string | null;
  condition: string;
  gradeKey: string | null;
  mark: VaultDisplayMark;
  trades: number;
  vaultUnits: number;
  instantExit: { bestBidCents: number | null; shareOfMarkBps: number | null; available: boolean; reason: string | null };
  depositable: boolean;
}

export interface VaultDepositBody {
  skuId: string;
  variantId: string;
  /** 'DS' | 'VNDS' | 'Used' (default 'DS'). Ungraded items only. */
  condition?: string;
}

export class VaultMarketsChannelsResource {
  constructor(private http: HttpClient) {}

  /** Your channel switches, whether a Telegram chat is linked, and nudges sent today. */
  get() {
    return this.http.request<VaultChannels>({ method: 'GET', path: '/v1/vault-markets/channels' });
  }

  /** Change `telegramAlerts`, `telegramDigest` or `pushCapPerDay` (0..20). */
  update(body: Partial<Pick<VaultChannels, 'telegramAlerts' | 'telegramDigest' | 'pushCapPerDay'>>, opts: IdempotencyOpts = {}) {
    return this.http.request<VaultChannels>({ method: 'PUT', path: '/v1/vault-markets/channels', body, idempotencyKey: opts.idempotencyKey });
  }

  /** This week's digest as it would go out (with its plain-text `lines`). */
  digestPreview() {
    return this.http.request<JsonObject & { week: string; lines: string[] }>({ method: 'GET', path: '/v1/vault-markets/digest/preview' });
  }

  /** Past weekly digests. */
  digestHistory() {
    return this.http.request<{ data: JsonObject[] }>({ method: 'GET', path: '/v1/vault-markets/digest/history' });
  }

  /** A catalogue item's vault book keys: display mark, units in the vault, Instant Exit price, ship-in. */
  value(skuId: string, variantId?: string) {
    return this.http.request<{ sku: { id: string; name: string; imageUrl: string | null }; keys: VaultValueKey[] }>({
      method: 'GET', path: '/v1/vault-markets/value', query: variantId ? { skuId, variantId } : { skuId },
    });
  }

  /** Your collection at the display marks (`meta.totals`); unmarked items are counted, never valued. */
  collectionWorth() {
    return this.http.request<{ data: JsonObject[]; meta: { totals: JsonObject } }>({ method: 'GET', path: '/v1/vault-markets/collection-worth' });
  }

  /** Watch every collection item that sits on a vault book key. */
  watchCollection(opts: IdempotencyOpts = {}) {
    return this.http.request<{ watched: number; skipped: number }>({ method: 'POST', path: '/v1/vault-markets/collection-worth/watch', idempotencyKey: opts.idempotencyKey });
  }

  /** Open a ship-in deposit for an ungraded catalogue item; it is inbound until the vault receives it. */
  deposit(body: VaultDepositBody, opts: IdempotencyOpts = {}) {
    return this.http.request<{ vaultItem: { id: string; status: string } }>({ method: 'POST', path: '/v1/vault-markets/deposits', body, idempotencyKey: opts.idempotencyKey });
  }
}

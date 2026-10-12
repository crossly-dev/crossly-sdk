// ── The buyer vault ─────────────────────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.vault`. Items Crossly stores for
// you, authenticated: sell one without shipping it, or ship it home.

import type { HttpClient, IdempotencyOpts } from '../_shared.js';

export interface VaultItem {
  id: string;
  /** stored | listed | withdraw_requested | shipped_out | inbound | received */
  status: string;
  skuId: string;
  skuName: string | null;
  imageUrl: string | null;
  variantId: string | null;
  variantLabel: string | null;
  condition: string;
  gradeKey: string | null;
  location: string | null;
  lastSaleCents: number | null;
  askPriceCents: number | null;
  withdrawSpeed: string | null;
  withdrawTracking: string | null;
  receivedAt: string | null;
}
export interface PurchaseOptions {
  /** The lowest ask is vault stock: it can be kept vaulted instantly, or fast-shipped. */
  vaultStock: boolean;
  fastShipCents: number;
  /** Open Crossly Grading runs a raw card can go straight to (bid `gradeWith`). */
  gradingRuns: { id: string; graderName: string; tierName: string; priceCents: number; cutoffAt: string }[];
}

/** The vault. Reading needs `buyer:orders:read`; selling `buyer:offers:write`; shipping home `buyer:checkout:write`. */
export class BuyerVaultResource {
  constructor(private http: HttpClient) {}

  items() {
    return this.http.request<{ data: VaultItem[]; meta: { withdrawCents: { standard: number; expedited: number } } }>({ method: 'GET', path: '/v1/buyer/vault' });
  }

  /** List it on the market. It is already authenticated: when it sells, nothing ships in. */
  sell(id: string, input: { priceCents: number; expiresInDays?: number }) {
    return this.http.request<{ data: { askId: string; matched: boolean } }>({ method: 'POST', path: `/v1/buyer/vault/${encodeURIComponent(id)}/list`, body: input });
  }

  unlist(id: string) {
    return this.http.request<{ data: { ok: boolean } }>({ method: 'POST', path: `/v1/buyer/vault/${encodeURIComponent(id)}/unlist` });
  }

  /** Ship it home. The shipping is charged now; pass an idempotencyKey. */
  withdraw(id: string, speed: 'standard' | 'expedited' = 'standard', opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { ok: boolean; feeCents: number } }>({ method: 'POST', path: `/v1/buyer/vault/${encodeURIComponent(id)}/withdraw`, body: { speed }, idempotencyKey: opts.idempotencyKey });
  }

  /** Before you bid or buy: vault stock? fast-ship price? grading runs? */
  purchaseOptions(variantId: string, condition?: string) {
    return this.http.request<{ data: PurchaseOptions }>({ method: 'GET', path: '/v1/buyer/market/purchase-options', query: { variantId, ...(condition ? { condition } : {}) } });
  }
}

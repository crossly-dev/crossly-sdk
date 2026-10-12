// ── Pack openings ───────────────────────────────────────────────────
//
// Composed onto `BuyerResource` as `buyer.packs`. Every pack publishes its
// tiers, odds, what is left and its expected value; every pull is a real
// item into your vault, drawn by a provably-fair roll you can re-run once the
// server seed is revealed (`fairness` / `rotateSeed`).

import type { HttpClient, IdempotencyOpts } from '../_shared.js';

export interface PackTier { id: string; name: string; weight: number; oddsPct: number; available: number; minValueCents: number | null; maxValueCents: number | null; avgValueCents: number }
export interface Pack {
  id: string; slug: string; title: string; description: string | null; imageUrl: string | null;
  priceCents: number; status: string; buybackBps: number; buybackDays: number;
  tiers: PackTier[]; expectedValueCents: number; openable: boolean;
  chase: { title: string | null; imageUrl: string | null; valueCents: number; tierId: string }[];
}
export interface PackOpening {
  id: string; packTitle: string; packSlug: string;
  /** pending_payment | opened | sold_back */
  status: string;
  priceCents: number; valueCents: number | null; buybackCents: number | null;
  itemTitle: string | null; imageUrl: string | null; tierName: string | null; vaultItemId: string | null; openedAt: string | null;
  proof: { serverSeedHash: string; serverSeed: string | null; clientSeed: string; nonce: number; tierItemIds: string[] | null; tierWeights: { id: string; weight: number }[] | null; tierId: string | null; poolItemId: string | null };
}
export interface PackFairness {
  serverSeedHash: string; clientSeed: string; nonce: number;
  revealed: { id: string; serverSeed: string; serverSeedHash: string; clientSeed: string; nonce: number; revealedAt: string }[];
}

/** Packs. Browsing needs `buyer:catalog:read`; opening `buyer:checkout:write` (it charges your saved card); selling back `buyer:offers:write`. */
export class BuyerPacksResource {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.request<{ data: Pack[] }>({ method: 'GET', path: '/v1/buyer/packs' });
  }

  get(slug: string) {
    return this.http.request<{ data: Pack }>({ method: 'GET', path: `/v1/buyer/packs/${encodeURIComponent(slug)}` });
  }

  /** Open one. CHARGES the pack price to your saved card; you must confirm you are 18+. Pass an idempotencyKey. */
  open(slug: string, input: { confirmAdult: true; paymentMethodId?: string }, opts: IdempotencyOpts = {}) {
    return this.http.request<{ data: { openingId: string; status: 'opened' } }>({ method: 'POST', path: `/v1/buyer/packs/${encodeURIComponent(slug)}/open`, body: input, idempotencyKey: opts.idempotencyKey });
  }

  openings() {
    return this.http.request<{ data: PackOpening[] }>({ method: 'GET', path: '/v1/buyer/pack-openings' });
  }

  /** Sell a pull back for Crossly credit at the pack's buyback rate, inside its window. */
  sellBack(openingId: string) {
    return this.http.request<{ data: { creditCents: number } }>({ method: 'POST', path: `/v1/buyer/pack-openings/${encodeURIComponent(openingId)}/sell-back` });
  }

  fairness() {
    return this.http.request<{ data: PackFairness }>({ method: 'GET', path: '/v1/buyer/packs/fairness' });
  }

  /** Reveal the current server seed (so past pulls can be re-run) and start a new one. */
  rotateSeed(clientSeed?: string) {
    return this.http.request<{ data: PackFairness }>({ method: 'POST', path: '/v1/buyer/packs/fairness/rotate', body: clientSeed ? { clientSeed } : {} });
  }
}

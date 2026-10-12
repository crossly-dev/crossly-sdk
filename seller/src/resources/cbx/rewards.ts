/**
 * Earn tiers, boosts, and rate resolution.
 *
 * Split out of `CbxResource` to stay under the repo's file-size cap.
 * Reached as `client.cbx.rewards.*`.
 */
import type { HttpClient, JsonObject } from '../_shared.js';

export class CbxRewardsResource {
  constructor(private http: HttpClient) {}

  // ── Earn tiers ───────────────────────────────────────────────────

  /**
   * Earn terms on offer — a longer maturation buys a higher rate.
   *
   * A term structure on a rebate, not a yield: the user chooses when to
   * be paid for a purchase they already made. Nothing accrues to a
   * balance for being held.
   */
  earnTiers() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/earn-tiers' });
  }

  /**
   * Define an earn term. Upserts on `slug`.
   *
   * Setting `isDefault` moves the default off whatever held it —
   * exactly one active default per merchant, because two would make
   * "what rate did this user get" depend on row order.
   */
  createEarnTier(params: {
    slug: string;
    label: string;
    maturationDays: number;
    earnRateBps: number;
    isDefault?: boolean;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/earn-tiers',
      body: params,
    });
  }

  // ── Boosts ───────────────────────────────────────────────────────

  /** Your funded cashback boosts, with live burn against budget. */
  boosts() {
    return this.http.request<JsonObject>({ method: 'GET', path: '/v1/cbx/boosts' });
  }

  /**
   * Fund elevated cashback on matching items.
   *
   * A boost REPLACES your base or tier rate rather than adding to it:
   * you are stating the total you will pay. `budgetCents` is a hard
   * ceiling charged inside the accrual transaction, so it cannot
   * overspend — when it runs out, matching orders fall back to your base
   * rate rather than failing or accruing zero.
   *
   * Most specific target wins: sku > collection > category > all.
   */
  createBoost(params: {
    name: string;
    targetKind?: 'all' | 'category' | 'sku' | 'collection';
    targetValue?: string;
    boostedRateBps: number;
    budgetCents: number;
    startsAt: string;
    endsAt: string;
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/boosts',
      body: params,
    });
  }

  /** Stop a boost matching further orders. Refunds nothing already accrued. */
  pauseBoost(boostId: string) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: `/v1/cbx/boosts/${encodeURIComponent(boostId)}/pause`,
    });
  }

  // ── Rates ────────────────────────────────────────────────────────

  /**
   * What an order would earn, and why — without accruing anything.
   *
   * Does NOT reserve boost budget, so a quote and the subsequent accrual
   * can differ if the budget runs out in between. The accrual response
   * repeats the rate it actually granted for that reason.
   */
  quoteRate(params: {
    subjectId: string;
    paidCents: number;
    tierSlug?: string;
    target?: { category?: string; sku?: string; collection?: string };
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/rates/quote',
      body: params,
    });
  }

  /**
   * Accrue cashback for an order and let us do the rate maths.
   *
   * Prefer this over `accrue` unless you compute your own rates: it
   * resolves the tier, the boost and the user's stake boost, charges
   * your boost budget in the same transaction, and records what rate was
   * actually granted.
   *
   * Idempotent on `externalId` — a retried webhook neither accrues
   * twice nor charges your budget twice.
   */
  accruePurchase(params: {
    subjectId: string;
    paidCents: number;
    externalId: string;
    tierSlug?: string;
    target?: { category?: string; sku?: string; collection?: string };
  }) {
    return this.http.request<JsonObject>({
      method: 'POST',
      path: '/v1/cbx/accruals/purchase',
      body: params,
    });
  }
}

import type { HttpClient, JsonObject } from './_shared.js';

/**
 * How the shipping figure in an estimate was arrived at.
 *
 * Worth reading before acting on `netCents`: `unknown` means we had no weight
 * and therefore did NOT deduct shipping, so the net is optimistic on any
 * platform where the seller buys their own label.
 */
export type ShippingSource =
  | 'quoted'
  | 'platform_label'
  | 'buyer_paid'
  | 'none'
  | 'unknown';

export interface NetPayoutEstimate {
  platform: string;
  grossCents: number;
  feeCents: number;
  /** `estimated` from the fee model; `exact` only for a platform-reported fee. */
  feeSource: 'exact' | 'estimated';
  shippingCents: number;
  shippingSource: ShippingSource;
  netCents: number;
  /** Net as a percentage of gross — comparable across price points. */
  takeHomePct: number;
  /**
   * Everything the estimate assumed, in plain language. EMPTY when nothing was
   * assumed, so a non-empty list always means something. Surface these rather
   * than the bare number when a decision rests on it.
   */
  assumptions: string[];
}

export interface PayoutParams {
  /** Total packed ounces. Without it, shipping is not deducted. */
  weightOz?: number;
  /** A known shipping cost in cents — overrides every inference. */
  shippingCents?: number;
  /** Overrides the platform default; use `seller` for free shipping. */
  shippingPaidBy?: 'buyer' | 'seller';
}

// ─── Net payout (fees + shipping → what you actually keep) ──────────────────

export class PayoutResource {
  constructor(private http: HttpClient) {}

  /** What one platform nets at a price. Envelope: `{ data }`. */
  estimate(params: { platform: string; priceCents: number } & PayoutParams) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/payout/estimate',
      query: params,
    });
  }

  /**
   * Rank platforms by what they net. Omit `platforms` to compare the ones the
   * seller is actually connected to — a ranking that includes marketplaces
   * they cannot list on is advice they cannot take.
   */
  compare(params: { priceCents: number; platforms?: string[] } & PayoutParams) {
    const { platforms, ...rest } = params;
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/payout/compare',
      query: { ...rest, ...(platforms ? { platforms: platforms.join(',') } : {}) },
    });
  }

  /**
   * The gross price needed to clear a target net.
   *
   * The inverse of `estimate`, and what a payout floor has to become before
   * any pricing rule can act on it: "never net less than $40" is a different
   * gross on every platform.
   */
  grossForNet(params: { platform: string; netCents: number } & PayoutParams) {
    return this.http.request<JsonObject>({
      method: 'GET',
      path: '/v1/payout/gross-for-net',
      query: params,
    });
  }
}

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

// ─── Stripe payout account (Connect) ────────────────────────────────────────

/**
 * `active` is the only status Crossly can pay. `payouts_unavailable`: the
 * account exists, but Stripe offers Crossly no way to transfer to its country
 * yet (anywhere outside the US, Canada, the UK, the EEA and Switzerland), so
 * buyers cannot check out the seller's listings.
 */
export type ConnectPayoutStatus = 'pending' | 'active' | 'restricted' | 'payouts_unavailable';

export interface ConnectAccountView {
  status: ConnectPayoutStatus;
  accountId: string;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  transfersActive: boolean;
  detailsSubmitted: boolean;
  /** US accounts only; always false elsewhere. */
  taxReporting1099kReady: boolean;
  /** ISO 3166-1 alpha-2. */
  country: string | null;
  /** `full` (US/CA/UK/EEA/CH) or `recipient` (everywhere else Stripe onboards). */
  agreement: 'full' | 'recipient';
  /** Settlement currency the seller is paid out in (USD, GBP, EUR…). */
  defaultCurrency: string | null;
  payoutsSupported: boolean;
  /** Why the seller can't be paid yet; null when active. */
  message: string | null;
}

export interface ConnectNotStarted {
  status: 'not_started';
  /** The country onboarding would use: storefront ship-from, else US. */
  defaultCountry: string;
}

export type ConnectStatusResponse = { data: ConnectAccountView | ConnectNotStarted };

export interface ConnectOnboardResponse {
  data: {
    /** Stripe-hosted onboarding page; a person completes it. */
    url: string;
    country: string;
    agreement: 'full' | 'recipient';
    payoutsSupported: boolean;
  };
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

  /** The seller's Stripe payout account: status, country, agreement, payout currency. Requires `accounts:read`. */
  connectStatus() {
    return this.http.request<ConnectStatusResponse>({
      method: 'GET',
      path: '/v1/payout/connect',
    });
  }

  /**
   * Start or resume payout-account onboarding; returns a Stripe-hosted URL a
   * person completes. `country` (ISO alpha-2) defaults to the storefront
   * ship-from country, then US, and is fixed once the account exists (409
   * `connect_country_mismatch`); 422 `connect_country_unsupported` where
   * Stripe can't onboard. Requires `payouts:write` (never grantable to a
   * third-party app).
   */
  connectOnboard(params: { country?: string } = {}) {
    return this.http.request<ConnectOnboardResponse>({
      method: 'POST',
      path: '/v1/payout/connect/onboard',
      body: params,
    });
  }
}

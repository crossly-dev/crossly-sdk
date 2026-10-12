import type { HttpClient } from './_shared.js';

export interface PricingSettings { matchOwnPrices: boolean; acceptsLayaway: boolean }
export interface SellerLayaway { id: string; purchaseId: string; status: 'active' | 'paid' | 'cancelled'; title: string; priceCents: number; paidCents: number; remainingCents: number; nextDueAt: string | null; finalDueAt: string }

/** What one catalog product sold for over `days` days. All prices integer cents. */
export interface SoldComps {
  medianCents: number;
  p25Cents: number;
  p75Cents: number;
  /** Null under 10 sales. */
  p10Cents: number | null;
  p90Cents: number | null;
  sales: number;
  days: number;
  lastSoldAt: string;
  /** Days from listing to sale; null until 3+ timed sales from 2+ sellers. */
  daysToSell: { medianDays: number; p25Days: number; p75Days: number; sample: number } | null;
}
export type SoldCompsHoldCode = 'no_market_sku' | 'mixed_inventory' | 'below_privacy_floor';
export interface SoldCompsResult {
  marketSkuId: string | null;
  condition: string | null;
  /** Null until there are 3+ sales from 2+ different sellers. */
  comps: SoldComps | null;
  holdCode: SoldCompsHoldCode | null;
}
export type SoldCompsQuery = { marketSkuId: string; condition?: string } | { listingId: string };

/** Selling options: own-price match and layaway. Reading needs `listings:read`; saving `listings:write`. */
export class PricingResource {
  constructor(private readonly http: HttpClient) {}
  settings() { return this.http.request<{ data: PricingSettings }>({ method: 'GET', path: '/v1/pricing/settings' }); }
  /** Your items on layaway: do not ship an active one. Needs `orders:read`. */
  layaways() { return this.http.request<{ data: SellerLayaway[] }>({ method: 'GET', path: '/v1/layaways' }); }
  saveSettings(input: Partial<PricingSettings>) { return this.http.request<{ data: PricingSettings }>({ method: 'PUT', path: '/v1/pricing/settings', body: input }); }
  /**
   * What the same catalog product actually sold for (the numbers a `sold_median`
   * reprice rule prices against), by market SKU or by one of your listings.
   * Needs `listings:read`.
   */
  soldComps(query: SoldCompsQuery) { return this.http.request<{ data: SoldCompsResult }>({ method: 'GET', path: '/v1/pricing/sold-comps', query }); }
}

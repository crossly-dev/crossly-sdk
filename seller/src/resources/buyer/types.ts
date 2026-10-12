/**
 * Catalogue, monitor and checkout shapes for `BuyerResource`.
 *
 * Re-exported from `../buyer.js`, which stays the public import path —
 * nothing outside this directory should reach in here.
 */

export interface CatalogItem {
  slug: string;
  title: string;
  priceCents: number;
  /** MSRP above the ask, or null. Never fabricated from a stale value. */
  compareAtCents: number | null;
  currency: string;
  condition: string | null;
  brand: string | null;
  categoryMain: string | null;
  categorySub: string | null;
  thumbnail: string | null;
  images: string[];
  sellerUsername: string | null;
  sellerDisplayName: string | null;
  /** Units a buyer can take right now. Reserved units are excluded. */
  quantityAvailable: number;
  listedAt: string | null;
  url: string;
}

export interface CatalogSearchParams {
  q?: string;
  brand?: string;
  category?: string;
  condition?: string;
  seller?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  /** ISO instant. Only listings that went live after it. */
  listedAfter?: string;
  inStockOnly?: boolean;
  /** `popular` is deliberately unavailable — see the class docblock. */
  sort?: 'newest' | 'price_low' | 'price_high';
  /** Max 100. */
  limit?: number;
  /** Opaque. Pass back what `meta.nextCursor` gave you. */
  cursor?: string;
}

export interface ListingDetail extends Omit<CatalogItem, 'url'> {
  description: string | null;
  /** Resolves even when delisted or sold — see `available`. */
  status: string;
  available: boolean;
  size: string | null;
  color: string[] | null;
}

export interface Availability {
  slug: string;
  available: boolean;
  quantityAvailable: number;
  priceCents: number;
  currency: string;
  status: string;
}

export type MonitorKind = 'new_listing' | 'price_drop' | 'back_in_stock';

export interface Monitor {
  id: string;
  name: string;
  kind: MonitorKind;
  query: Record<string, unknown>;
  delivery: 'webhook' | 'poll';
  webhookUrl: string | null;
  /**
   * Returned ONLY when the monitor is created, and never again. Store it then
   * — a secret readable on every list is a secret that leaks through the first
   * screenshot or support paste.
   */
  webhookSecret?: string;
  active: boolean;
  pausedReason: string | null;
  matchCount: number;
  lastCheckedAt: string | null;
  lastMatchAt: string | null;
  createdAt: string;
}

export interface MonitorMatch {
  listingSlug: string;
  /** `-1` when this kind has no price trigger. */
  triggerPriceCents: number;
  deliveredAt: string | null;
  createdAt: string;
}

export interface CheckoutControls {
  patId: string;
  enabled: boolean;
  dailyLimitCents: number;
  perOrderLimitCents: number;
  maxUnitsPerListingPerDay: number;
}

/** One shipping service a buyer can pick (Standard, Expedited, an international service). */
export interface ShippingServiceOption {
  id: string;
  name: string;
  /** Price for the requested quantity, in cents. */
  cents: number;
  scope: 'domestic' | 'international';
  costType: 'flat' | 'calculated' | 'free';
  /** Business days to delivery, handling included; null when the seller states none. */
  minDays: number | null;
  maxDays: number | null;
}

/** GET /v1/buyer/catalog/listings/:slug/shipping */
export interface ListingShipping {
  /** The default (cheapest) service's price; null when the seller doesn't ship there. */
  cents: number | null;
  kind: 'free' | 'flat' | 'calculated' | 'standard' | null;
  quantity: number;
  destinationCountry: string;
  shipsToCountry: boolean;
  noShipReason: 'not_offered' | 'excluded' | 'not_in_ship_to' | null;
  services: ShippingServiceOption[];
  defaultServiceId: string | null;
  international: {
    offered: boolean;
    shipsTo: 'worldwide' | string[];
    excludes: string[];
    importChargesNote: boolean;
  };
  /** Show "Import duties and taxes may be charged on delivery." */
  importChargesNote: boolean;
  freeShippingThresholdCents: number | null;
}

/**
 * Import duties, taxes and fees for a listing shipped to a country.
 * `status: 'included'` = charged at checkout, ships DDP (no bill at the door);
 * `'unavailable'` = ships DDU, the carrier or customs may charge on delivery
 * (`notice`); `'none'` = the parcel does not cross a border. US-dollar cents.
 */
export interface LandedCostQuote {
  slug: string;
  destinationCountry: string;
  postalCode: string | null;
  quantity: number;
  currency: 'USD';
  shipsToCountry: boolean;
  /** The cheapest shipping service's price, used for the quote. */
  shippingCents: number | null;
  status: 'included' | 'unavailable' | 'none';
  incoterm: 'DDP' | 'DDU' | null;
  dutiesCents: number;
  taxesCents: number;
  feesCents: number;
  /** duties + taxes + fees. */
  totalCents: number;
  notice: string | null;
}

export interface BuyResult {
  listingSlug: string;
  quantity: number;
  totalCents: number;
  currency: string;
  paymentStatus: string;
  paymentIntentId: string | null;
  orderId: string | null;
  /** What the card was charged in: 'usd' unless `payInCurrency` was honoured. */
  chargeCurrency?: string;
  /** The charge in `chargeCurrency` minor units (cents, or whole yen). */
  chargeAmountMinor?: number;
}

import type { HttpClient, IdempotencyOpts } from './_shared.js';

// ─── Storefront shipping: ship-from, ship-to scope, per-listing customs ─────

/** One shipping service a buyer can pick (Standard / Expedited / an international one). Money is integer CENTS. */
export interface ShippingServiceInput {
  id: string;
  name: string;
  costType: 'flat' | 'calculated' | 'free';
  flatRateCents?: number;
  additionalItemCents?: number;
  minDays?: number;
  maxDays?: number;
  speed?: 'standard' | 'expedited' | 'overnight';
}

/**
 * The storefront shipping policy. `international` decides which countries
 * you ship to:
 *  - domestic only: `enabled: false`;
 *  - selected countries: `enabled: true, shipsTo: ['GB', 'CA', …]`;
 *  - worldwide except: `enabled: true, shipsTo: 'worldwide', excludes: [...]`.
 * Codes are ISO 3166-1 alpha-2; unknown codes are dropped and embargoed
 * destinations (CU, IR, KP, SY) are removed from a ship-to list on save.
 */
export interface StorefrontShippingPolicy {
  handlingTimeDays: number;
  domestic: {
    costType: 'flat' | 'calculated' | 'free';
    flatRateCents?: number;
    additionalItemCents?: number;
    carriers: Array<'USPS' | 'UPS' | 'FedEx' | 'DHL'>;
    services?: ShippingServiceInput[];
  };
  international: {
    costType: 'flat' | 'calculated' | 'free' | 'not_offered';
    flatRateCents?: number;
    additionalItemCents?: number;
    carriers?: Array<'USPS' | 'UPS' | 'FedEx' | 'DHL'>;
    excludedRegions?: string[];
    enabled?: boolean;
    shipsTo?: 'worldwide' | string[];
    excludes?: string[];
    services?: ShippingServiceInput[];
    importChargesNote?: boolean;
  };
  localPickup: boolean;
  packageInfo?: { weightOz?: number; lengthIn?: number; widthIn?: number; heightIn?: number } | null;
}

/** A ship-from address. `country` is ISO alpha-2 (default US); state and postal code are required per country. */
export interface ShipFromAddressInput {
  fullName: string;
  company?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string | null;
}

export interface ShipFromAddressView {
  fullName: string;
  company: string | null;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
}

export interface StorefrontShipping {
  /** Null when never set (Crossly's $5/item default applies). */
  shippingPolicy: StorefrontShippingPolicy | null;
  /** The default ship-from address; its country decides what is domestic. */
  shipFrom: ShipFromAddressView | null;
}

export interface StorefrontShippingResponse {
  data: StorefrontShipping;
}

export interface StorefrontShippingUpdate {
  /** Replaces the whole policy; null clears it. */
  shippingPolicy?: StorefrontShippingPolicy | null;
  /** Replaces your default ship-from address (422 for a sanctioned origin). */
  shipFrom?: ShipFromAddressInput;
}

export interface ListingCustomsUpdate {
  /** 6–10 digit HS tariff code (dots and spaces allowed); null clears. */
  hsCode?: string | null;
  /** ISO alpha-2; null clears. */
  countryOfOrigin?: string | null;
  /** Countries this item must not ship to on Crossly; [] clears. 409 when the listing is not on Crossly yet. */
  restrictedCountries?: string[];
}

export interface ListingCustoms {
  listingId: string;
  hsCode: string | null;
  countryOfOrigin: string | null;
  restrictedCountries: string[];
}

export interface ListingCustomsResponse {
  data: ListingCustoms;
}

export class StorefrontShippingResource {
  constructor(private http: HttpClient) {}

  /** Your shipping policy (incl. which countries you ship to) and default ship-from address. */
  get() {
    return this.http.request<StorefrontShippingResponse>({
      method: 'GET',
      path: '/v1/storefront/shipping',
    });
  }

  /** Set the shipping policy and/or the default ship-from address. */
  update(body: StorefrontShippingUpdate, opts: IdempotencyOpts = {}) {
    return this.http.request<StorefrontShippingResponse>({
      method: 'PUT',
      path: '/v1/storefront/shipping',
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** Set a listing's HS code, country of origin and Crossly don't-ship-to countries. */
  setListingCustoms(listingId: string, body: ListingCustomsUpdate, opts: IdempotencyOpts = {}) {
    return this.http.request<ListingCustomsResponse>({
      method: 'PUT',
      path: `/v1/listings/${encodeURIComponent(listingId)}/customs`,
      body,
      idempotencyKey: opts.idempotencyKey,
    });
  }
}

// ── Buyer wave 3: price match + price protection ────────────────────
//
// Composed onto `BuyerResource` as `buyer.pricing`.

import type { HttpClient } from '../_shared.js';

export interface ListingPrice {
  priceCents: number;
  /** Set when the price was lowered to the seller's own cheaper copy elsewhere. */
  priceMatch: { listPriceCents: number; platform: string } | null;
  /** The other marketplaces it is live on — it is never cheaper on any of them. */
  lowestAnywhere: { platforms: string[] } | null;
  priceProtectionDays: number | null;
  /** Against real sales of the same catalog item in the same condition (180 days); null until 3+ sales from 2+ sellers. */
  priceCheck: PriceCheck | null;
}
export interface PriceCheck { verdict: 'great' | 'good' | 'fair' | 'high'; medianCents: number; lowCents: number; highCents: number; sales: number; days: number; lastSoldAt: string }
export interface PriceProtection { until: string; active: boolean; creditedCents: number }

/** The price you'd pay and the protection after you pay. Needs `buyer:catalog:read` / `buyer:orders:read`. */
export class BuyerPricingResource {
  constructor(private readonly http: HttpClient) {}
  /** Today's price for a listing, own-price matched, and where else it's live. */
  price(slug: string) { return this.http.request<{ data: ListingPrice }>({ method: 'GET', path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/price` }); }
  /** An order's price protection: until when, and what it has credited to your Bucks. */
  protection(orderId: string) { return this.http.request<{ data: PriceProtection | null }>({ method: 'GET', path: `/v1/buyer/orders/${encodeURIComponent(orderId)}/price-protection` }); }
}

export interface VideoRequest { id: string; slug: string | null; title: string; imageUrl: string | null; note: string | null; status: 'open' | 'answered' | 'declined'; videoUrl: string | null; sellerNote: string | null; answeredAt: string | null; createdAt: string }
export interface ListingVideo { id: string; videoUrl: string; question: string | null; sellerNote: string | null; answeredAt: string }

/** Ask a seller for a video of an item; read the answers. Asking needs `buyer:activity:write`. Composed as `buyer.videos`. */
export class BuyerVideoRequestsResource {
  constructor(private readonly http: HttpClient) {}
  request(slug: string, note?: string) { return this.http.request<{ data: VideoRequest }>({ method: 'POST', path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/video-requests`, body: { note } }); }
  forListing(slug: string) { return this.http.request<{ data: ListingVideo[] }>({ method: 'GET', path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/videos` }); }
  mine() { return this.http.request<{ data: VideoRequest[] }>({ method: 'GET', path: '/v1/buyer/video-requests' }); }
}

export type RegistryKind = 'wedding' | 'baby' | 'birthday' | 'housewarming' | 'graduation' | 'other';
export interface RegistryItem { platformListingId: string; slug: string | null; title: string; note: string | null; priceCents: number; imageUrl: string | null; available: boolean; desired: number; purchased: number; remaining: number }
export interface Registry { id: string; title: string; kind: RegistryKind; eventDate: string | null; message: string | null; registrantName: string; token: string; mine: boolean; canShip: boolean; wishlistId?: string; shipAddressId?: string | null; items: RegistryItem[] }
export interface RegistryRow { id: string; wishlistId: string; title: string; kind: RegistryKind; eventDate: string | null; token: string; hasShipAddress: boolean; itemCount: number }
export interface RegistryHit { token: string; title: string; kind: RegistryKind; eventDate: string | null; registrantName: string }
export interface RegistryGift { id: string; itemTitle: string; quantity: number; giverName: string; message: string | null; thanked: boolean; createdAt: string }
export interface RegistryInput { title?: string; kind?: RegistryKind; eventDate?: string | null; message?: string | null; shipAddressId?: string | null }

/** Gift registries: a wishlist with an occasion and a hidden ship-to. Needs `buyer:wishlist:*`. Composed as `buyer.registries`. */
export class BuyerRegistriesResource {
  constructor(private readonly http: HttpClient) {}
  list() { return this.http.request<{ data: RegistryRow[] }>({ method: 'GET', path: '/v1/buyer/registries' }); }
  create(input: RegistryInput) { return this.http.request<{ data: RegistryRow }>({ method: 'POST', path: '/v1/buyer/registries', body: input }); }
  search(q: string) { return this.http.request<{ data: RegistryHit[] }>({ method: 'GET', path: '/v1/buyer/registries/search', query: { q } }); }
  get(id: string) { return this.http.request<{ data: Registry }>({ method: 'GET', path: `/v1/buyer/registries/${encodeURIComponent(id)}` }); }
  update(id: string, input: RegistryInput) { return this.http.request<{ data: Registry }>({ method: 'PATCH', path: `/v1/buyer/registries/${encodeURIComponent(id)}`, body: input }); }
  delete(id: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'DELETE', path: `/v1/buyer/registries/${encodeURIComponent(id)}` }); }
  setDesired(id: string, platformListingId: string, desired: number) { return this.http.request<{ data: { platformListingId: string; desiredQty: number } }>({ method: 'PUT', path: `/v1/buyer/registries/${encodeURIComponent(id)}/items/${encodeURIComponent(platformListingId)}`, body: { desired } }); }
  gifts(id: string) { return this.http.request<{ data: RegistryGift[] }>({ method: 'GET', path: `/v1/buyer/registries/${encodeURIComponent(id)}/gifts` }); }
  markThanked(id: string, giftId: string, thanked = true) { return this.http.request<{ data: { id: string; thanked: boolean } }>({ method: 'POST', path: `/v1/buyer/registries/${encodeURIComponent(id)}/gifts/${encodeURIComponent(giftId)}/thanked`, body: { thanked } }); }
  /** A registry as a guest sees it. Price a gift off it with POST /v1/buyer/cart/quote { registryToken }; the shop checkout takes the same token. */
  byToken(token: string) { return this.http.request<{ data: Registry }>({ method: 'GET', path: `/v1/buyer/registry/${encodeURIComponent(token)}` }); }
}

export interface LayawayInstallment { dueAt: string; cents: number; paid: boolean }
export interface Layaway { id: string; purchaseId: string; status: 'active' | 'paid' | 'cancelled'; title: string; slug: string | null; imageUrl: string | null; priceCents: number; depositCents: number; paidCents: number; remainingCents: number; nextDueAt: string | null; finalDueAt: string; lastError: string | null; cancelFeeCents: number; paidInFullAt: string | null; cancelledAt: string | null; schedule: LayawayInstallment[] }

/** Layaway: deposit at checkout (layawayItemIds), the rest in installments. Needs `buyer:orders:*`. Composed as `buyer.layaways`. */
export class BuyerLayawaysResource {
  constructor(private readonly http: HttpClient) {}
  list() { return this.http.request<{ data: Layaway[] }>({ method: 'GET', path: '/v1/buyer/layaways' }); }
  get(id: string) { return this.http.request<{ data: Layaway }>({ method: 'GET', path: `/v1/buyer/layaways/${encodeURIComponent(id)}` }); }
  pay(id: string, amountCents?: number) { return this.http.request<{ data: Layaway }>({ method: 'POST', path: `/v1/buyer/layaways/${encodeURIComponent(id)}/pay`, body: amountCents ? { amountCents } : {} }); }
  cancel(id: string) { return this.http.request<{ data: Layaway }>({ method: 'POST', path: `/v1/buyer/layaways/${encodeURIComponent(id)}/cancel` }); }
}

export interface RentalOffer { dailyCents: number; weeklyCents: number | null; depositCents: number; minDays: number; maxDays: number; bufferDays: number; rentOnly: boolean; available: boolean; booked: RentalRange[] }
export interface RentalRange { start: string; end: string }
export interface RentalShipTo { name: string; street1: string; street2?: string | null; city: string; state: string; zip: string; country?: string | null; phone?: string | null }
export interface RentalQuoteInput { startDate: string; days: number; shipTo?: RentalShipTo; addressId?: string }
export interface RentalQuote { startDate: string; endDate: string; days: number; problem: string | null; rentCents: number; depositCents: number; shippingCents: number | null; totalCents: number | null }
export interface RentalBooking { rentalId: string; clientSecret: string | null; totalCents: number; needsApproval: boolean }
export interface RenterEligibility { identityVerified: boolean; verifiedName: string | null; ok: boolean; reason: string | null }
export interface IdentityStart { alreadyVerified?: true; clientSecret?: string | null; url?: string | null; verificationId?: string }
export interface Rental { id: string; status: string; slug: string | null; title: string; imageUrl: string | null; startDate: string; endDate: string; days: number; rentCents: number; shippingCents: number; depositCents: number; outboundTracking: string | null; returnTracking: string | null; labelUrl: string | null; claimCents: number; claimNote: string | null; claimPhotos: string[]; claimDisputed: boolean; depositRefundedCents: number; shippedAt: string | null; returnedAt: string | null; closedAt: string | null; createdAt: string }

/** Rent instead of buy. Reading needs `buyer:catalog:read`; booking `buyer:checkout:write`; yours `buyer:orders:*`. Composed as `buyer.rentals`. */
export class BuyerRentalsResource {
  constructor(private readonly http: HttpClient) {}
  offer(slug: string) { return this.http.request<{ data: RentalOffer | null }>({ method: 'GET', path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/rental` }); }
  quote(slug: string, input: RentalQuoteInput) { return this.http.request<{ data: RentalQuote }>({ method: 'POST', path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/rental/quote`, body: input }); }
  /** Returns a PaymentIntent client secret: confirm it with Stripe to reserve the dates (held 30 minutes). */
  book(slug: string, input: RentalQuoteInput) { return this.http.request<{ data: RentalBooking }>({ method: 'POST', path: `/v1/buyer/catalog/listings/${encodeURIComponent(slug)}/rental`, body: input }); }
  mine() { return this.http.request<{ data: Rental[] }>({ method: 'GET', path: '/v1/buyer/rentals' }); }
  cancel(id: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'POST', path: `/v1/buyer/rentals/${encodeURIComponent(id)}/cancel` }); }
  /** ID-verified, the name rentals ship to, and whether you can rent now. */
  eligibility() { return this.http.request<{ data: RenterEligibility }>({ method: 'GET', path: '/v1/buyer/rentals/eligibility' }); }
  /** Start the ID check renting needs (photo ID + selfie). */
  startIdentity() { return this.http.request<{ data: IdentityStart }>({ method: 'POST', path: '/v1/buyer/rentals/identity/start' }); }
  arrivalPhotos(id: string, photos: string[]) { return this.http.request<{ data: unknown }>({ method: 'POST', path: `/v1/buyer/rentals/${encodeURIComponent(id)}/arrival-photos`, body: { photos } }); }
  respondToClaim(id: string, accept: boolean) { return this.http.request<{ data: { ok: boolean } }>({ method: 'POST', path: `/v1/buyer/rentals/${encodeURIComponent(id)}/claim-response`, body: { accept } }); }
}

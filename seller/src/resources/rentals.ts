import type { HttpClient } from './_shared.js';

export interface RentalOfferInput { dailyCents: number; weeklyCents?: number | null; depositCents: number; minDays: number; maxDays: number; bufferDays: number; rentOnly?: boolean; requireApproval?: boolean; active?: boolean }
export interface SellerRentalOffer extends RentalOfferInput { platformListingId: string; slug: string | null; title: string; imageUrl: string | null; createdAt: string; updatedAt: string }
export interface SellerRental { id: string; status: string; title: string; startDate: string; endDate: string; days: number; rentCents: number; shippingCents: number; depositCents: number; labelUrl: string | null; outboundTracking: string | null; returnTracking: string | null; claimCents: number; shipTo?: Record<string, unknown> }
export interface RentalClaimInput { cents: number; note: string; photos?: string[] }

/** Rent your Crossly listings out. Offers need `listings:*`; bookings `orders:*`. */
export class RentalsResource {
  constructor(private readonly http: HttpClient) {}
  list() { return this.http.request<{ data: SellerRental[] }>({ method: 'GET', path: '/v1/rentals' }); }
  offers() { return this.http.request<{ data: SellerRentalOffer[] }>({ method: 'GET', path: '/v1/rentals/offers' }); }
  setOffer(platformListingId: string, input: RentalOfferInput) { return this.http.request<{ data: SellerRentalOffer }>({ method: 'PUT', path: `/v1/rentals/offers/${encodeURIComponent(platformListingId)}`, body: input }); }
  removeOffer(platformListingId: string) { return this.http.request<{ data: { ok: boolean } }>({ method: 'DELETE', path: `/v1/rentals/offers/${encodeURIComponent(platformListingId)}` }); }
  /** Buy the outbound and return labels. */
  labels(id: string) { return this.http.request<{ data: SellerRental }>({ method: 'POST', path: `/v1/rentals/${encodeURIComponent(id)}/labels` }); }
  /** At least 2 photos of its condition as it leaves (URLs you uploaded). */
  shipped(id: string, photos: string[]) { return this.http.request<{ data: SellerRental }>({ method: 'POST', path: `/v1/rentals/${encodeURIComponent(id)}/shipped`, body: { photos } }); }
  approve(id: string) { return this.http.request<{ data: SellerRental }>({ method: 'POST', path: `/v1/rentals/${encodeURIComponent(id)}/approve` }); }
  decline(id: string) { return this.http.request<{ data: SellerRental }>({ method: 'POST', path: `/v1/rentals/${encodeURIComponent(id)}/decline` }); }
  returned(id: string) { return this.http.request<{ data: SellerRental }>({ method: 'POST', path: `/v1/rentals/${encodeURIComponent(id)}/returned` }); }
  cancel(id: string) { return this.http.request<{ data: SellerRental }>({ method: 'POST', path: `/v1/rentals/${encodeURIComponent(id)}/cancel` }); }
  claim(id: string, input: RentalClaimInput) { return this.http.request<{ data: SellerRental }>({ method: 'POST', path: `/v1/rentals/${encodeURIComponent(id)}/claim`, body: input }); }
}
